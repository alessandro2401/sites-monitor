import { db, queries } from '../db'
import { alertas, notificacoes } from '../../drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { NotificationService } from './notificationService'

export class AlertEngine {
  /**
   * Processa alertas críticos imediatamente
   */
  static async processarAlertaCritico(alertaId: string): Promise<void> {
    const alerta = await db.query.alertas.findFirst({
      where: (a, { eq }) => eq(a.id, alertaId),
    })

    if (!alerta) return

    // Enviar notificações imediatas
    await NotificationService.enviarRedFlag(alerta)

    // Atualizar status de notificação
    await db.update(alertas)
      .set({
        email_enviado: true,
        whatsapp_enviado: true,
      })
      .where(eq(alertas.id, alertaId))
  }

  /**
   * Processa alertas de alta severidade com delay
   */
  static async processarAlertaAlto(alertaId: string, delayMinutos: number = 5): Promise<void> {
    const alerta = await db.query.alertas.findFirst({
      where: (a, { eq }) => eq(a.id, alertaId),
    })

    if (!alerta) return

    // Agendar próxima tentativa
    const proximaTentativa = new Date(Date.now() + delayMinutos * 60 * 1000)

    await db.update(alertas)
      .set({
        proxima_tentativa: proximaTentativa,
        tentativas_notificacao: alerta.tentativas_notificacao + 1,
      })
      .where(eq(alertas.id, alertaId))
  }

  /**
   * Verifica alertas pendentes e envia notificações
   */
  static async processarAlertasPendentes(): Promise<void> {
    const agora = new Date()

    const alertasPendentes = await db.query.alertas.findMany({
      where: (a, { eq, lt, isNotNull }) => ({
        resolvido: eq(a.resolvido, false),
        proxima_tentativa: lt(a.proxima_tentativa, agora),
        email_enviado: eq(a.email_enviado, false),
      }),
    })

    for (const alerta of alertasPendentes) {
      if (alerta.severidade === 'critica') {
        await this.processarAlertaCritico(alerta.id)
      } else if (alerta.severidade === 'alta') {
        // Verificar se o problema ainda existe
        const site = await queries.sites.getById(alerta.site_id)
        if (site) {
          const ultimoCheck = await queries.healthChecks.getLatest(alerta.site_id)
          
          // Se problema persistir, enviar notificação
          if (ultimoCheck && ultimoCheck.status !== 'online') {
            await NotificationService.enviarNotificacao(alerta, 'push')
            
            await db.update(alertas)
              .set({
                push_enviado: true,
                tentativas_notificacao: alerta.tentativas_notificacao + 1,
              })
              .where(eq(alertas.id, alerta.id))
          } else {
            // Problema resolvido, marcar alerta como resolvido
            await db.update(alertas)
              .set({
                resolvido: true,
                resolvido_em: new Date(),
              })
              .where(eq(alertas.id, alerta.id))
          }
        }
      }
    }
  }

  /**
   * Resolve alertas quando o problema é resolvido
   */
  static async resolverAlerta(alertaId: string, usuarioId?: string): Promise<void> {
    await db.update(alertas)
      .set({
        resolvido: true,
        resolvido_em: new Date(),
        resolvido_por: usuarioId,
      })
      .where(eq(alertas.id, alertaId))

    // Enviar notificação de recuperação
    const alerta = await db.query.alertas.findFirst({
      where: (a, { eq }) => eq(a.id, alertaId),
    })

    if (alerta) {
      await NotificationService.enviarNotificacaoRecuperacao(alerta)
    }
  }

  /**
   * Escalona alertas críticos não resolvidos
   */
  static async escalonarAlertas(): Promise<void> {
    const alertasAntigos = await db.query.alertas.findMany({
      where: (a, { eq, lt }) => ({
        resolvido: eq(a.resolvido, false),
        severidade: eq(a.severidade, 'critica'),
        criado_em: lt(a.criado_em, new Date(Date.now() - 30 * 60 * 1000)), // 30 minutos
      }),
    })

    for (const alerta of alertasAntigos) {
      // Enviar notificação de escalação
      await NotificationService.enviarNotificacaoEscalacao(alerta)

      // Incrementar tentativas
      await db.update(alertas)
        .set({
          tentativas_notificacao: alerta.tentativas_notificacao + 1,
        })
        .where(eq(alertas.id, alerta.id))
    }
  }

  /**
   * Limpa alertas antigos resolvidos
   */
  static async limparAlertasAntigos(diasRetencao: number = 30): Promise<void> {
    const dataLimite = new Date(Date.now() - diasRetencao * 24 * 60 * 60 * 1000)

    // Não deletar, apenas marcar como arquivado (se houver campo)
    // Por enquanto, apenas deixar no banco para auditoria
    console.log(`Alertas anteriores a ${dataLimite.toISOString()} mantidos para auditoria`)
  }

  /**
   * Gera relatório de alertas
   */
  static async gerarRelatoriAlertas(periodo: '24h' | '7d' | '30d' = '24h') {
    const horas = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }[periodo]

    const dataInicio = new Date(Date.now() - horas * 60 * 60 * 1000)

    const alertasGerados = await db.query.alertas.findMany({
      where: (a, { gte }) => gte(a.criado_em, dataInicio),
    })

    const alertasResolvidos = alertasGerados.filter(a => a.resolvido)
    const alertasAtivos = alertasGerados.filter(a => !a.resolvido)

    const porSeveridade = {
      critica: alertasGerados.filter(a => a.severidade === 'critica').length,
      alta: alertasGerados.filter(a => a.severidade === 'alta').length,
      media: alertasGerados.filter(a => a.severidade === 'media').length,
      baixa: alertasGerados.filter(a => a.severidade === 'baixa').length,
    }

    const porTipo = alertasGerados.reduce((acc, alerta) => {
      acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      periodo,
      total: alertasGerados.length,
      resolvidos: alertasResolvidos.length,
      ativos: alertasAtivos.length,
      porSeveridade,
      porTipo,
      tempoMedioResolucao: this.calcularTempoMedioResolucao(alertasResolvidos),
    }
  }

  /**
   * Calcula tempo médio de resolução
   */
  private static calcularTempoMedioResolucao(alertas: any[]): number {
    if (alertas.length === 0) return 0

    const tempos = alertas.map(a => {
      if (!a.resolvido_em) return 0
      return (a.resolvido_em.getTime() - a.criado_em.getTime()) / (1000 * 60) // em minutos
    })

    return Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
  }
}
