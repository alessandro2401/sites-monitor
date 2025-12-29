import cron from 'node-cron'
import { HealthCheckService } from './services/healthCheckService'
import { AlertEngine } from './services/alertEngine'
import { db, queries } from './db'

/**
 * Inicia o scheduler de verificações de saúde
 */
export function startScheduler() {
  console.log('🚀 Iniciando scheduler de monitoramento...')

  // Executar health check a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Executando health checks...`)
    
    try {
      const results = await HealthCheckService.checkAllSites()
      
      // Detectar mudanças de status
      for (const [siteId, result] of results) {
        await HealthCheckService.detectStatusChange(siteId, result)
      }

      console.log(`✅ Health checks completados: ${results.size} sites verificados`)
    } catch (error) {
      console.error('❌ Erro ao executar health checks:', error)
    }
  })

  // Processar alertas pendentes a cada 1 minuto
  cron.schedule('* * * * *', async () => {
    try {
      await AlertEngine.processarAlertasPendentes()
    } catch (error) {
      console.error('❌ Erro ao processar alertas pendentes:', error)
    }
  })

  // Escalonar alertas críticos não resolvidos a cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Escalando alertas críticos...`)
    
    try {
      await AlertEngine.escalonarAlertas()
      console.log('✅ Alertas escalados')
    } catch (error) {
      console.error('❌ Erro ao escalonar alertas:', error)
    }
  })

  // Limpar alertas antigos diariamente às 2 da manhã
  cron.schedule('0 2 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Limpando alertas antigos...`)
    
    try {
      await AlertEngine.limparAlertasAntigos(30)
      console.log('✅ Alertas antigos limpos')
    } catch (error) {
      console.error('❌ Erro ao limpar alertas antigos:', error)
    }
  })

  console.log('✅ Scheduler iniciado com sucesso!')
  console.log('📋 Tarefas agendadas:')
  console.log('  • Health checks: A cada 5 minutos')
  console.log('  • Processar alertas pendentes: A cada 1 minuto')
  console.log('  • Escalonar alertas críticos: A cada 30 minutos')
  console.log('  • Limpar alertas antigos: Diariamente às 2:00 AM')
}

/**
 * Para o scheduler
 */
export function stopScheduler() {
  cron.getTasks().forEach(task => task.stop())
  console.log('⏹️ Scheduler parado')
}
