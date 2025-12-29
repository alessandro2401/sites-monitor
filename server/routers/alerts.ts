import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, queries } from '../db'
import { alertas, auditLog } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { AlertEngine } from '../services/alertEngine'
import { TRPCError } from '@trpc/server'

export const alertsRouter = router({
  /**
   * Listar alertas ativos
   */
  ativos: publicProcedure
    .input(z.object({
      siteId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      return await queries.alertas.getActive(input.siteId)
    }),

  /**
   * Obter histórico de alertas
   */
  historico: publicProcedure
    .input(z.object({
      siteId: z.string().uuid().optional(),
      limite: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return await queries.alertas.getHistory(input.siteId, input.limite)
    }),

  /**
   * Obter alertas por severidade
   */
  porSeveridade: publicProcedure
    .input(z.object({
      severidade: z.enum(['baixa', 'media', 'alta', 'critica']),
    }))
    .query(async ({ input }) => {
      return await queries.alertas.getBySeverity(input.severidade)
    }),

  /**
   * Resolver alerta
   */
  resolver: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      notas: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const alerta = await db.query.alertas.findFirst({
        where: (a, { eq }) => eq(a.id, input.id),
      })

      if (!alerta) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta não encontrado',
        })
      }

      await AlertEngine.resolverAlerta(input.id, ctx.user.id)

      // Registrar no audit log
      await db.insert(auditLog).values({
        usuario_id: ctx.user.id,
        acao: 'resolver_alerta',
        recurso: 'alertas',
        recurso_id: input.id,
        dados_novos: { resolvido: true, notas: input.notas },
      })

      return { success: true }
    }),

  /**
   * Obter estatísticas de alertas
   */
  estatisticas: publicProcedure
    .input(z.object({
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      return await AlertEngine.gerarRelatoriAlertas(input.periodo)
    }),

  /**
   * Obter alertas por tipo
   */
  porTipo: publicProcedure.query(async () => {
    const alertasAtivos = await queries.alertas.getActive()

    const porTipo = alertasAtivos.reduce((acc, alerta) => {
      acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(porTipo).map(([tipo, count]) => ({
      tipo,
      count,
    }))
  }),

  /**
   * Obter alertas críticos não resolvidos
   */
  criticos: publicProcedure.query(async () => {
    return await queries.alertas.getBySeverity('critica')
  }),

  /**
   * Obter tendência de alertas
   */
  tendencia: publicProcedure
    .input(z.object({
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const horas = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[input.periodo]

      const dataInicio = new Date(Date.now() - horas * 60 * 60 * 1000)

      const alertasGerados = await db.query.alertas.findMany({
        where: (a, { gte }) => gte(a.criado_em, dataInicio),
      })

      // Agrupar por hora
      const porHora = new Map<string, number>()

      alertasGerados.forEach(alerta => {
        const hora = new Date(alerta.criado_em).toISOString().split(':')[0]
        porHora.set(hora, (porHora.get(hora) || 0) + 1)
      })

      return Array.from(porHora.entries()).map(([hora, count]) => ({
        hora,
        alertas: count,
      }))
    }),

  /**
   * Obter tempo médio de resolução
   */
  tempoMedioResolucao: publicProcedure
    .input(z.object({
      siteId: z.string().uuid().optional(),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const horas = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[input.periodo]

      const dataInicio = new Date(Date.now() - horas * 60 * 60 * 1000)

      const where = input.siteId
        ? (a: any, { gte, eq }: any) => ({
            criado_em: gte(a.criado_em, dataInicio),
            site_id: eq(a.site_id, input.siteId),
            resolvido: eq(a.resolvido, true),
          })
        : (a: any, { gte, eq }: any) => ({
            criado_em: gte(a.criado_em, dataInicio),
            resolvido: eq(a.resolvido, true),
          })

      const alertasResolvidos = await db.query.alertas.findMany({
        where,
      })

      if (alertasResolvidos.length === 0) {
        return {
          tempoMedio: 0,
          tempoMin: 0,
          tempoMax: 0,
          total: 0,
        }
      }

      const tempos = alertasResolvidos.map(a => {
        if (!a.resolvido_em) return 0
        return (a.resolvido_em.getTime() - a.criado_em.getTime()) / (1000 * 60) // em minutos
      })

      const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length
      const tempoMin = Math.min(...tempos)
      const tempoMax = Math.max(...tempos)

      return {
        tempoMedio: Math.round(tempoMedio),
        tempoMin: Math.round(tempoMin),
        tempoMax: Math.round(tempoMax),
        total: alertasResolvidos.length,
      }
    }),
})
