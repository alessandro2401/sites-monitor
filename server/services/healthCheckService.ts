import { db, queries } from '../db'
import { healthChecks, alertas, sites } from '../../drizzle/schema'
import { eq, desc } from 'drizzle-orm'

export interface HealthCheckResult {
  status: 'online' | 'offline' | 'timeout' | 'error'
  codigo_http?: number
  tempo_resposta?: number
  taxa_erro?: number
  mensagem_erro?: string
  database_status?: 'connected' | 'disconnected' | 'unknown'
  cache_status?: 'connected' | 'disconnected' | 'unknown'
  ssl_status?: 'valid' | 'expired' | 'invalid' | 'unknown'
}

export class HealthCheckService {
  /**
   * Executa health check para um site específico
   */
  static async checkSite(siteId: string): Promise<HealthCheckResult> {
    const site = await queries.sites.getById(siteId)
    
    if (!site) {
      throw new Error(`Site ${siteId} não encontrado`)
    }

    try {
      const startTime = Date.now()
      
      const response = await fetch(site.endpoint_health, {
        method: 'GET',
        timeout: site.timeout * 1000,
        headers: {
          'Accept': 'application/json',
          ...(site.api_key && { 'Authorization': `Bearer ${site.api_key}` }),
        },
      })

      const tempoResposta = Date.now() - startTime

      if (!response.ok) {
        return {
          status: 'error',
          codigo_http: response.status,
          tempo_resposta: tempoResposta,
          mensagem_erro: `HTTP ${response.status}`,
        }
      }

      const data = await response.json()

      return {
        status: data.status === 'ok' ? 'online' : 'error',
        codigo_http: response.status,
        tempo_resposta: tempoResposta,
        taxa_erro: data.metrics?.errorRate || 0,
        database_status: data.database || 'unknown',
        cache_status: data.cache || 'unknown',
        ssl_status: data.ssl || 'unknown',
      }
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError' || error.code === 'ETIMEDOUT'
      
      return {
        status: isTimeout ? 'timeout' : 'offline',
        mensagem_erro: error.message,
        tempo_resposta: site.timeout * 1000,
      }
    }
  }

  /**
   * Executa health check para todos os sites ativos
   */
  static async checkAllSites(): Promise<Map<string, HealthCheckResult>> {
    const activeSites = await queries.sites.getActive()
    const results = new Map<string, HealthCheckResult>()

    for (const site of activeSites) {
      try {
        const result = await this.checkSite(site.id)
        results.set(site.id, result)

        // Armazenar resultado no banco de dados
        await db.insert(healthChecks).values({
          site_id: site.id,
          status: result.status,
          codigo_http: result.codigo_http,
          tempo_resposta: result.tempo_resposta,
          taxa_erro: result.taxa_erro?.toString(),
          mensagem_erro: result.mensagem_erro,
          database_status: result.database_status,
          cache_status: result.cache_status,
          ssl_status: result.ssl_status,
        })
      } catch (error) {
        console.error(`Erro ao verificar site ${site.id}:`, error)
        results.set(site.id, {
          status: 'error',
          mensagem_erro: 'Erro ao verificar site',
        })
      }
    }

    return results
  }

  /**
   * Calcula uptime de um site em um período
   */
  static async calculateUptime(siteId: string, horas: number = 24): Promise<number> {
    const checks = await queries.healthChecks.getHistory(siteId, horas)
    
    if (checks.length === 0) return 0

    const online = checks.filter(c => c.status === 'online').length
    return (online / checks.length) * 100
  }

  /**
   * Obtém métricas agregadas de um site
   */
  static async getMetrics(siteId: string, periodo: '24h' | '7d' | '30d' = '24h') {
    const horas = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }[periodo]

    const checks = await queries.healthChecks.getHistory(siteId, horas)

    if (checks.length === 0) {
      return {
        uptime: 0,
        tempoMedio: 0,
        taxaErroMedia: 0,
        total: 0,
        online: 0,
        offline: 0,
      }
    }

    const online = checks.filter(c => c.status === 'online').length
    const tempoMedio = checks.reduce((sum, c) => sum + (c.tempo_resposta || 0), 0) / checks.length
    const taxaErroMedia = checks.reduce((sum, c) => sum + (parseFloat(c.taxa_erro?.toString() || '0') || 0), 0) / checks.length

    return {
      uptime: ((online / checks.length) * 100).toFixed(2),
      tempoMedio: tempoMedio.toFixed(0),
      taxaErroMedia: taxaErroMedia.toFixed(2),
      total: checks.length,
      online,
      offline: checks.length - online,
    }
  }

  /**
   * Detecta mudanças de status e cria alertas
   */
  static async detectStatusChange(siteId: string, novoStatus: HealthCheckResult): Promise<void> {
    const site = await queries.sites.getById(siteId)
    if (!site) return

    // Obter último status
    const ultimoCheck = await queries.healthChecks.getLatest(siteId)
    const statusAnterior = ultimoCheck?.status || 'unknown'

    // Detectar mudança para offline
    if (statusAnterior === 'online' && novoStatus.status === 'offline') {
      await db.insert(alertas).values({
        site_id: siteId,
        tipo: 'offline',
        severidade: 'critica',
        titulo: `${site.nome} está OFFLINE`,
        mensagem: `O site ${site.nome} deixou de responder. Último status: ${novoStatus.mensagem_erro}`,
      })
    }

    // Detectar mudança para online
    if (statusAnterior === 'offline' && novoStatus.status === 'online') {
      const alertaAberto = await db.query.alertas.findFirst({
        where: (a, { eq, and }) => ({
          site_id: eq(a.site_id, siteId),
          tipo: eq(a.tipo, 'offline'),
          resolvido: eq(a.resolvido, false),
        }),
      })

      if (alertaAberto) {
        await db.update(alertas)
          .set({
            resolvido: true,
            resolvido_em: new Date(),
          })
          .where(eq(alertas.id, alertaAberto.id))
      }
    }

    // Detectar tempo de resposta alto
    if (novoStatus.tempo_resposta && novoStatus.tempo_resposta > site.threshold_tempo_resposta) {
      const alertaExistente = await db.query.alertas.findFirst({
        where: (a, { eq, and }) => ({
          site_id: eq(a.site_id, siteId),
          tipo: eq(a.tipo, 'tempo_alto'),
          resolvido: eq(a.resolvido, false),
        }),
      })

      if (!alertaExistente) {
        await db.insert(alertas).values({
          site_id: siteId,
          tipo: 'tempo_alto',
          severidade: 'media',
          titulo: `${site.nome} - Tempo de resposta alto`,
          mensagem: `Tempo de resposta: ${novoStatus.tempo_resposta}ms (limite: ${site.threshold_tempo_resposta}ms)`,
        })
      }
    }

    // Detectar taxa de erro alta
    if (novoStatus.taxa_erro && novoStatus.taxa_erro > parseFloat(site.threshold_taxa_erro.toString())) {
      const alertaExistente = await db.query.alertas.findFirst({
        where: (a, { eq, and }) => ({
          site_id: eq(a.site_id, siteId),
          tipo: eq(a.tipo, 'erro_alto'),
          resolvido: eq(a.resolvido, false),
        }),
      })

      if (!alertaExistente) {
        await db.insert(alertas).values({
          site_id: siteId,
          tipo: 'erro_alto',
          severidade: 'alta',
          titulo: `${site.nome} - Taxa de erro alta`,
          mensagem: `Taxa de erro: ${novoStatus.taxa_erro}% (limite: ${site.threshold_taxa_erro}%)`,
        })
      }
    }
  }
}
