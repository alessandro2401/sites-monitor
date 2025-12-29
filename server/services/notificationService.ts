import { db } from '../db'
import { notificacoes } from '../../drizzle/schema'
import nodemailer from 'nodemailer'

// Configurar transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export class NotificationService {
  /**
   * Envia RED FLAG por email para alertas críticos
   */
  static async enviarRedFlag(alerta: any): Promise<void> {
    const site = await db.query.sites.findFirst({
      where: (s, { eq }) => eq(s.id, alerta.site_id),
    })

    if (!site) return

    const emailDestino = process.env.ALERT_EMAIL || 'alessandro@pizzolatto.com'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 RED FLAG - ALERTA CRÍTICO</h1>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${site.nome}</h2>
          
          <div style="background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
            <p style="margin: 0; color: #6b7280;"><strong>Tipo de Problema:</strong></p>
            <p style="margin: 5px 0 15px 0; color: #1f2937; font-size: 16px;">${alerta.titulo}</p>
            
            <p style="margin: 0; color: #6b7280;"><strong>Descrição:</strong></p>
            <p style="margin: 5px 0 15px 0; color: #1f2937;">${alerta.mensagem}</p>
            
            <p style="margin: 0; color: #6b7280;"><strong>Severidade:</strong></p>
            <p style="margin: 5px 0 15px 0; color: #dc2626; font-weight: bold; font-size: 16px;">
              ${alerta.severidade.toUpperCase()}
            </p>
            
            <p style="margin: 0; color: #6b7280;"><strong>Hora do Alerta:</strong></p>
            <p style="margin: 5px 0; color: #1f2937;">${new Date(alerta.criado_em).toLocaleString('pt-BR')}</p>
          </div>

          <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>⚠️ Ação Recomendada:</strong></p>
            <p style="margin: 5px 0; color: #991b1b;">
              Acesse o painel de monitoramento imediatamente para investigar o problema.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="https://sites.administradoramutual.com.br/admin/alertas" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Acessar Painel de Alertas
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Este é um email automático do Sistema de Monitoramento de Sites.<br>
            Não responda este email. Para suporte, acesse o painel de monitoramento.
          </p>
        </div>
      </div>
    `

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'alertas@administradoramutual.com.br',
        to: emailDestino,
        subject: `🚨 RED FLAG: ${site.nome} - ${alerta.titulo}`,
        html: htmlContent,
      })

      // Registrar no banco de dados
      await db.insert(notificacoes).values({
        alerta_id: alerta.id,
        tipo: 'email',
        destinatario: emailDestino,
        assunto: `🚨 RED FLAG: ${site.nome} - ${alerta.titulo}`,
        corpo: alerta.mensagem,
        status: 'enviado',
      })

      console.log(`RED FLAG enviado para ${emailDestino}`)
    } catch (error) {
      console.error('Erro ao enviar RED FLAG:', error)

      await db.insert(notificacoes).values({
        alerta_id: alerta.id,
        tipo: 'email',
        destinatario: emailDestino,
        assunto: `🚨 RED FLAG: ${site.nome} - ${alerta.titulo}`,
        corpo: alerta.mensagem,
        status: 'falha',
        erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  /**
   * Envia notificação genérica
   */
  static async enviarNotificacao(alerta: any, tipo: 'email' | 'whatsapp' | 'sms' | 'push'): Promise<void> {
    const site = await db.query.sites.findFirst({
      where: (s, { eq }) => eq(s.id, alerta.site_id),
    })

    if (!site) return

    const emailDestino = site.email_responsavel || process.env.ALERT_EMAIL || 'alessandro@pizzolatto.com'

    try {
      if (tipo === 'email') {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 20px;">⚠️ ALERTA: ${site.nome}</h1>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1f2937; margin-top: 0;">${alerta.titulo}</h2>
              <p style="color: #4b5563;">${alerta.mensagem}</p>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://sites.administradoramutual.com.br/admin/alertas" 
                   style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Ver Detalhes
                </a>
              </div>
            </div>
          </div>
        `

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'alertas@administradoramutual.com.br',
          to: emailDestino,
          subject: `⚠️ Alerta: ${site.nome} - ${alerta.titulo}`,
          html: htmlContent,
        })
      }

      await db.insert(notificacoes).values({
        alerta_id: alerta.id,
        tipo: tipo as any,
        destinatario: emailDestino,
        assunto: alerta.titulo,
        corpo: alerta.mensagem,
        status: 'enviado',
      })
    } catch (error) {
      console.error(`Erro ao enviar notificação ${tipo}:`, error)

      await db.insert(notificacoes).values({
        alerta_id: alerta.id,
        tipo: tipo as any,
        destinatario: emailDestino,
        assunto: alerta.titulo,
        corpo: alerta.mensagem,
        status: 'falha',
        erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    }
  }

  /**
   * Envia notificação de recuperação
   */
  static async enviarNotificacaoRecuperacao(alerta: any): Promise<void> {
    const site = await db.query.sites.findFirst({
      where: (s, { eq }) => eq(s.id, alerta.site_id),
    })

    if (!site) return

    const emailDestino = site.email_responsavel || process.env.ALERT_EMAIL || 'alessandro@pizzolatto.com'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">✅ RECUPERADO: ${site.nome}</h1>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">O problema foi resolvido</h2>
          <p style="color: #4b5563;">O site ${site.nome} voltou ao normal.</p>
          <p style="color: #4b5563;"><strong>Problema anterior:</strong> ${alerta.titulo}</p>
        </div>
      </div>
    `

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'alertas@administradoramutual.com.br',
        to: emailDestino,
        subject: `✅ Recuperado: ${site.nome}`,
        html: htmlContent,
      })

      await db.insert(notificacoes).values({
        alerta_id: alerta.id,
        tipo: 'email',
        destinatario: emailDestino,
        assunto: `✅ Recuperado: ${site.nome}`,
        corpo: `O problema foi resolvido: ${alerta.titulo}`,
        status: 'enviado',
      })
    } catch (error) {
      console.error('Erro ao enviar notificação de recuperação:', error)
    }
  }

  /**
   * Envia notificação de escalação
   */
  static async enviarNotificacaoEscalacao(alerta: any): Promise<void> {
    const site = await db.query.sites.findFirst({
      where: (s, { eq }) => eq(s.id, alerta.site_id),
    })

    if (!site) return

    const emailDestino = process.env.ALERT_EMAIL || 'alessandro@pizzolatto.com'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">🔴 ESCALAÇÃO: ${site.nome}</h1>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="color: #1f2937; font-weight: bold;">Este alerta não foi resolvido há mais de 30 minutos!</p>
          <p style="color: #4b5563;"><strong>Problema:</strong> ${alerta.titulo}</p>
          <p style="color: #4b5563;"><strong>Duração:</strong> Mais de 30 minutos</p>
          <p style="color: #4b5563;"><strong>Tentativas de notificação:</strong> ${alerta.tentativas_notificacao}</p>
        </div>
      </div>
    `

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'alertas@administradoramutual.com.br',
        to: emailDestino,
        subject: `🔴 ESCALAÇÃO: ${site.nome} - ${alerta.titulo}`,
        html: htmlContent,
      })
    } catch (error) {
      console.error('Erro ao enviar notificação de escalação:', error)
    }
  }
}
