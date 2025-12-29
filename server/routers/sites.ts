import { router, publicProcedure, protectedProcedure } from '../trpc'
import { db, queries } from '../db'
import { sites, integracaoConfig } from '../../drizzle/schema'
import { eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { HealthCheckService } from '../services/healthCheckService'
import { TRPCError } from '@trpc/server'

export const sitesRouter = router({
  /**
   * Listar todos os sites
   */
  list: publicProcedure.query(async () => {
    return await queries.sites.getAll()
  }),

  /**
   * Obter detalhes de um site
   */
  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const site = await queries.sites.getById(input.id)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }
      return site
    }),

  /**
   * Criar novo site
   */
  create: protectedProcedure
    .input(z.object({
      nome: z.string().min(3),
      url: z.string().url(),
      tipo: z.enum(['corretora', 'consorcio', 'seguros', 'holding', 'comunidade', 'outro']),
      descricao: z.string().optional(),
      endpoint_health: z.string().url(),
      endpoint_webhook: z.string().url().optional(),
      email_responsavel: z.string().email().optional(),
      telefone_responsavel: z.string().optional(),
      intervalo_verificacao: z.number().default(300),
      timeout: z.number().default(30),
      threshold_tempo_resposta: z.number().default(5000),
      threshold_taxa_erro: z.number().default(5),
      threshold_uptime: z.number().default(95),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se já existe site com este nome ou URL
      const existente = await db.query.sites.findFirst({
        where: (s, { or, eq }) => or(
          eq(s.nome, input.nome),
          eq(s.url, input.url)
        ),
      })

      if (existente) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe um site com este nome ou URL',
        })
      }

      const [site] = await db.insert(sites).values({
        nome: input.nome,
        url: input.url,
        tipo: input.tipo,
        descricao: input.descricao,
        endpoint_health: input.endpoint_health,
        endpoint_webhook: input.endpoint_webhook,
        email_responsavel: input.email_responsavel,
        telefone_responsavel: input.telefone_responsavel,
        intervalo_verificacao: input.intervalo_verificacao,
        timeout: input.timeout,
        threshold_tempo_resposta: input.threshold_tempo_resposta,
        threshold_taxa_erro: input.threshold_taxa_erro.toString(),
        threshold_uptime: input.threshold_uptime.toString(),
      }).returning()

      // Criar configuração de integração padrão
      await db.insert(integracaoConfig).values({
        site_id: site.id,
        tipo_integracao: 'health_check',
        config: {
          intervalo: input.intervalo_verificacao,
          timeout: input.timeout,
        },
      })

      // Registrar no audit log
      await db.insert(auditLog).values({
        usuario_id: ctx.user.id,
        acao: 'criar_site',
        recurso: 'sites',
        recurso_id: site.id,
        dados_novos: site,
      })

      return site
    }),

  /**
   * Atualizar site
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        nome: z.string().optional(),
        url: z.string().url().optional(),
        tipo: z.enum(['corretora', 'consorcio', 'seguros', 'holding', 'comunidade', 'outro']).optional(),
        descricao: z.string().optional(),
        ativo: z.boolean().optional(),
        intervalo_verificacao: z.number().optional(),
        timeout: z.number().optional(),
        endpoint_health: z.string().url().optional(),
        email_responsavel: z.string().email().optional(),
        threshold_tempo_resposta: z.number().optional(),
        threshold_taxa_erro: z.number().optional(),
        threshold_uptime: z.number().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const siteAnterior = await queries.sites.getById(input.id)
      if (!siteAnterior) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      const updateData: any = {}
      if (input.data.nome) updateData.nome = input.data.nome
      if (input.data.url) updateData.url = input.data.url
      if (input.data.tipo) updateData.tipo = input.data.tipo
      if (input.data.descricao !== undefined) updateData.descricao = input.data.descricao
      if (input.data.ativo !== undefined) updateData.ativo = input.data.ativo
      if (input.data.intervalo_verificacao) updateData.intervalo_verificacao = input.data.intervalo_verificacao
      if (input.data.timeout) updateData.timeout = input.data.timeout
      if (input.data.endpoint_health) updateData.endpoint_health = input.data.endpoint_health
      if (input.data.email_responsavel) updateData.email_responsavel = input.data.email_responsavel
      if (input.data.threshold_tempo_resposta) updateData.threshold_tempo_resposta = input.data.threshold_tempo_resposta
      if (input.data.threshold_taxa_erro) updateData.threshold_taxa_erro = input.data.threshold_taxa_erro.toString()
      if (input.data.threshold_uptime) updateData.threshold_uptime = input.data.threshold_uptime.toString()

      updateData.atualizado_em = new Date()

      const [site] = await db.update(sites)
        .set(updateData)
        .where(eq(sites.id, input.id))
        .returning()

      // Registrar no audit log
      await db.insert(auditLog).values({
        usuario_id: ctx.user.id,
        acao: 'atualizar_site',
        recurso: 'sites',
        recurso_id: input.id,
        dados_anteriores: siteAnterior,
        dados_novos: site,
      })

      return site
    }),

  /**
   * Deletar site (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const site = await queries.sites.getById(input.id)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      await db.update(sites)
        .set({ deletado_em: new Date() })
        .where(eq(sites.id, input.id))

      // Registrar no audit log
      await db.insert(auditLog).values({
        usuario_id: ctx.user.id,
        acao: 'deletar_site',
        recurso: 'sites',
        recurso_id: input.id,
        dados_anteriores: site,
      })

      return { success: true }
    }),

  /**
   * Testar conexão com site
   */
  test: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const site = await queries.sites.getById(input.id)
      if (!site) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Site não encontrado',
        })
      }

      try {
        const result = await HealthCheckService.checkSite(input.id)
        return {
          sucesso: result.status === 'online',
          status: result.status,
          tempo_resposta: result.tempo_resposta,
          codigo_http: result.codigo_http,
          mensagem_erro: result.mensagem_erro,
        }
      } catch (error) {
        return {
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        }
      }
    }),

  /**
   * Obter status geral de todos os sites
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
})

// Importar auditLog (será definido em outro arquivo)
import { auditLog } from '../../drizzle/schema'
