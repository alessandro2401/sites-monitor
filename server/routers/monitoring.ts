import { router, publicProcedure } from '../trpc'
import { db, queries } from '../db'
import { healthChecks } from '../../drizzle/schema'
import { z } from 'zod'
import { HealthCheckService } from '../services/healthCheckService'
import { TRPCError } from '@trpc/server'

export const monitoringRouter = router({
  /**
   * Obter status atual de todos os sites
   */
  statusGeral: publicProcedure.query(async () => {
    const allSites = await queries.sites.getAll()

    const statuses = await Promise.all(
      allSites.map(async (site) => {
        const lastCheck = await queries.healthChecks.getLatest(site.id)
        const uptime = await HealthCheckService.calculateUptime(site.id, 24)

        return {
          id: site.id,
          nome: site.nome,
          url: site.url,
          status: lastCheck?.status || 'unknown',
          tempo_resposta: lastCheck?.tempo_resposta,
          taxa_erro: lastCheck?.taxa_erro,
          uptime: uptime.toFixed(2),
          verificado_em: lastCheck?.verificado_em,
        }
      })
    )

    const online = statuses.filter(s => s.status === 'online').length
    const offline = statuses.filter(s => s.status === 'offline').length
    const degradado = statuses.filter(s => s.status === 'error' || s.status === 'timeout').length

    return {
      total: statuses.length,
      online,
      offline,
      degradado,
      sites: statuses,
    }
  }),

  /**
   * Obter histórico de verificações de um site
   */
  historico: publicProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      horas: z.number().default(24),
    }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.siteId)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      return await queries.healthChecks.getHistory(input.siteId, input.horas)
    }),

  /**
   * Obter métricas agregadas de um site
   */
  metricas: publicProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.siteId)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      return await HealthCheckService.getMetrics(input.siteId, input.periodo)
    }),

  /**
   * Obter dados para gráfico de uptime
   */
  graficoUptime: publicProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.siteId)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      const horas = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[input.periodo]

      const checks = await queries.healthChecks.getHistory(input.siteId, horas)

      // Agrupar por hora
      const porHora = new Map<string, { online: number; total: number }>()

      checks.forEach(check => {
        const hora = new Date(check.verificado_em).toISOString().split(':')[0]
        const stats = porHora.get(hora) || { online: 0, total: 0 }
        stats.total++
        if (check.status === 'online') stats.online++
        porHora.set(hora, stats)
      })

      return Array.from(porHora.entries()).map(([hora, stats]) => ({
        hora,
        uptime: ((stats.online / stats.total) * 100).toFixed(2),
      }))
    }),

  /**
   * Obter dados para gráfico de tempo de resposta
   */
  graficoTempoResposta: publicProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.siteId)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      const horas = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[input.periodo]

      const checks = await queries.healthChecks.getHistory(input.siteId, horas)

      // Agrupar por hora e calcular média
      const porHora = new Map<string, number[]>()

      checks.forEach(check => {
        const hora = new Date(check.verificado_em).toISOString().split(':')[0]
        const tempos = porHora.get(hora) || []
        if (check.tempo_resposta) tempos.push(check.tempo_resposta)
        porHora.set(hora, tempos)
      })

      return Array.from(porHora.entries()).map(([hora, tempos]) => ({
        hora,
        tempo_medio: (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(0),
        tempo_max: Math.max(...tempos),
        tempo_min: Math.min(...tempos),
      }))
    }),

  /**
   * Obter dados para gráfico de distribuição de status
   */
  graficoDistribuicaoStatus: publicProcedure
    .input(z.object({
      siteId: z.string().uuid(),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.siteId)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      const horas = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[input.periodo]

      const checks = await queries.healthChecks.getHistory(input.siteId, horas)

      const distribuicao = {
        online: 0,
        offline: 0,
        timeout: 0,
        error: 0,
        unknown: 0,
      }

      checks.forEach(check => {
        distribuicao[check.status as keyof typeof distribuicao]++
      })

      return [
        { name: 'Online', value: distribuicao.online, color: '#10b981' },
        { name: 'Offline', value: distribuicao.offline, color: '#ef4444' },
        { name: 'Timeout', value: distribuicao.timeout, color: '#f59e0b' },
        { name: 'Erro', value: distribuicao.error, color: '#8b5cf6' },
        { name: 'Desconhecido', value: distribuicao.unknown, color: '#6b7280' },
      ].filter(item => item.value > 0)
    }),

  /**
   * Comparar uptime de múltiplos sites
   */
  compararSites: publicProcedure
    .input(z.object({
      siteIds: z.array(z.string().uuid()),
      periodo: z.enum(['24h', '7d', '30d']).default('24h'),
    }))
    .query(async ({ input }) => {
      const comparacao = await Promise.all(
        input.siteIds.map(async (siteId) => {
          const site = await queries.sites.getById(siteId)
          if (!site) return null

          const metricas = await HealthCheckService.getMetrics(siteId, input.periodo)
          return {
            id: site.id,
            nome: site.nome,
            uptime: metricas.uptime,
            tempoMedio: metricas.tempoMedio,
            taxaErroMedia: metricas.taxaErroMedia,
          }
        })
      )

      return comparacao.filter(Boolean)
    }),
})
