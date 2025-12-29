import { pgTable, text, integer, boolean, timestamp, uuid, decimal, enum as pgEnum, jsonb, inet, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================================
// ENUM TYPES
// ============================================================================

export const siteTypeEnum = pgEnum('site_type', [
  'corretora',
  'consorcio',
  'seguros',
  'holding',
  'comunidade',
  'outro'
])

export const healthStatusEnum = pgEnum('health_status', [
  'online',
  'offline',
  'timeout',
  'error',
  'unknown'
])

export const componentStatusEnum = pgEnum('component_status', [
  'connected',
  'disconnected',
  'unknown'
])

export const alertTypeEnum = pgEnum('alert_type', [
  'offline',
  'tempo_alto',
  'erro_alto',
  'ssl',
  'quota',
  'db_error',
  'cache_error',
  'custom'
])

export const severityEnum = pgEnum('severity', [
  'baixa',
  'media',
  'alta',
  'critica'
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'email',
  'whatsapp',
  'sms',
  'push'
])

export const notificationStatusEnum = pgEnum('notification_status', [
  'enviado',
  'falha',
  'bounce',
  'lido'
])

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'monitor',
  'viewer'
])

export const integrationTypeEnum = pgEnum('integration_type', [
  'health_check',
  'webhook',
  'sdk',
  'manual'
])

// ============================================================================
// SITES TABLE
// ============================================================================

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull().unique(),
  url: text('url').notNull().unique(),
  tipo: siteTypeEnum('tipo').notNull(),
  descricao: text('descricao'),
  
  // Monitoramento
  ativo: boolean('ativo').default(true),
  intervalo_verificacao: integer('intervalo_verificacao').default(300), // segundos
  timeout: integer('timeout').default(30), // segundos
  
  // Endpoints
  endpoint_health: text('endpoint_health').notNull(),
  endpoint_webhook: text('endpoint_webhook'),
  
  // Credenciais (criptografadas)
  api_key: text('api_key'),
  api_secret: text('api_secret'),
  
  // Contatos
  email_responsavel: text('email_responsavel'),
  telefone_responsavel: text('telefone_responsavel'),
  
  // Thresholds
  threshold_tempo_resposta: integer('threshold_tempo_resposta').default(5000), // ms
  threshold_taxa_erro: decimal('threshold_taxa_erro', { precision: 5, scale: 2 }).default('5.0'), // %
  threshold_uptime: decimal('threshold_uptime', { precision: 5, scale: 2 }).default('95.0'), // %
  
  // Metadata
  criado_em: timestamp('criado_em').defaultNow(),
  atualizado_em: timestamp('atualizado_em').defaultNow(),
  deletado_em: timestamp('deletado_em'),
}, (table) => ({
  ativoIdx: index('sites_ativo_idx').on(table.ativo, table.criado_em),
  tipoIdx: index('sites_tipo_idx').on(table.tipo),
  deletadoIdx: index('sites_deletado_idx').on(table.deletado_em),
}))

// ============================================================================
// HEALTH CHECKS TABLE
// ============================================================================

export const healthChecks = pgTable('health_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  site_id: uuid('site_id').notNull().references(() => sites.id),
  
  // Status
  status: healthStatusEnum('status').notNull(),
  codigo_http: integer('codigo_http'),
  mensagem_erro: text('mensagem_erro'),
  
  // Métricas
  tempo_resposta: integer('tempo_resposta'), // ms
  taxa_erro: decimal('taxa_erro', { precision: 5, scale: 2 }), // %
  requisicoes_por_minuto: integer('requisicoes_por_minuto'),
  
  // Componentes
  database_status: componentStatusEnum('database_status'),
  cache_status: componentStatusEnum('cache_status'),
  ssl_status: componentStatusEnum('ssl_status'),
  
  // Timestamp
  verificado_em: timestamp('verificado_em').defaultNow(),
}, (table) => ({
  siteIdIdx: index('health_checks_site_id_idx').on(table.site_id, table.verificado_em),
  statusIdx: index('health_checks_status_idx').on(table.status, table.verificado_em),
  verificadoIdx: index('health_checks_verificado_idx').on(table.verificado_em),
}))

// ============================================================================
// ALERTAS TABLE
// ============================================================================

export const alertas = pgTable('alertas', {
  id: uuid('id').primaryKey().defaultRandom(),
  site_id: uuid('site_id').notNull().references(() => sites.id),
  
  // Tipo e Severidade
  tipo: alertTypeEnum('tipo').notNull(),
  severidade: severityEnum('severidade').notNull(),
  
  // Conteúdo
  titulo: text('titulo').notNull(),
  mensagem: text('mensagem').notNull(),
  
  // Status
  resolvido: boolean('resolvido').default(false),
  criado_em: timestamp('criado_em').defaultNow(),
  resolvido_em: timestamp('resolvido_em'),
  resolvido_por: uuid('resolvido_por').references(() => usuarios.id),
  
  // Notificações
  email_enviado: boolean('email_enviado').default(false),
  whatsapp_enviado: boolean('whatsapp_enviado').default(false),
  sms_enviado: boolean('sms_enviado').default(false),
  push_enviado: boolean('push_enviado').default(false),
  
  // Rastreamento
  tentativas_notificacao: integer('tentativas_notificacao').default(0),
  proxima_tentativa: timestamp('proxima_tentativa'),
}, (table) => ({
  siteIdIdx: index('alertas_site_id_idx').on(table.site_id, table.criado_em),
  severidadeIdx: index('alertas_severidade_idx').on(table.severidade, table.resolvido),
  criadoIdx: index('alertas_criado_idx').on(table.criado_em),
}))

// ============================================================================
// NOTIFICACOES TABLE
// ============================================================================

export const notificacoes = pgTable('notificacoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  alerta_id: uuid('alerta_id').notNull().references(() => alertas.id),
  
  // Tipo
  tipo: notificationTypeEnum('tipo').notNull(),
  
  // Destinatário
  destinatario: text('destinatario').notNull(),
  
  // Conteúdo
  assunto: text('assunto'),
  corpo: text('corpo').notNull(),
  
  // Status
  status: notificationStatusEnum('status').default('enviado'),
  erro_mensagem: text('erro_mensagem'),
  
  // Timestamp
  enviado_em: timestamp('enviado_em').defaultNow(),
  entregue_em: timestamp('entregue_em'),
}, (table) => ({
  alertaIdIdx: index('notificacoes_alerta_id_idx').on(table.alerta_id, table.enviado_em),
  tipoStatusIdx: index('notificacoes_tipo_status_idx').on(table.tipo, table.status),
  enviadoIdx: index('notificacoes_enviado_idx').on(table.enviado_em),
}))

// ============================================================================
// USUARIOS TABLE
// ============================================================================

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Autenticação
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  
  // Permissões
  role: userRoleEnum('role').default('viewer'),
  sites_permitidos: uuid('sites_permitidos').array(), // NULL = todos
  
  // Status
  ativo: boolean('ativo').default(true),
  criado_em: timestamp('criado_em').defaultNow(),
  ultimo_acesso: timestamp('ultimo_acesso'),
}, (table) => ({
  emailIdx: index('usuarios_email_idx').on(table.email),
  roleIdx: index('usuarios_role_idx').on(table.role),
}))

// ============================================================================
// AUDIT LOG TABLE
// ============================================================================

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuario_id: uuid('usuario_id').references(() => usuarios.id),
  
  // Ação
  acao: text('acao').notNull(),
  recurso: text('recurso').notNull(),
  recurso_id: uuid('recurso_id'),
  
  // Dados
  dados_anteriores: jsonb('dados_anteriores'),
  dados_novos: jsonb('dados_novos'),
  
  // Timestamp
  criado_em: timestamp('criado_em').defaultNow(),
  ip_address: inet('ip_address'),
  user_agent: text('user_agent'),
}, (table) => ({
  usuarioIdIdx: index('audit_log_usuario_id_idx').on(table.usuario_id, table.criado_em),
  recursoIdx: index('audit_log_recurso_idx').on(table.recurso, table.criado_em),
  criadoIdx: index('audit_log_criado_idx').on(table.criado_em),
}))

// ============================================================================
// INTEGRACAO CONFIG TABLE
// ============================================================================

export const integracaoConfig = pgTable('integracao_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  site_id: uuid('site_id').notNull().unique().references(() => sites.id),
  
  // Tipo de Integração
  tipo_integracao: integrationTypeEnum('tipo_integracao').notNull(),
  
  // Configuração
  config: jsonb('config').notNull(),
  
  // Status
  ativo: boolean('ativo').default(true),
  ultimo_teste: timestamp('ultimo_teste'),
  teste_resultado: pgEnum('teste_resultado', ['sucesso', 'falha', 'nao_testado'])('teste_resultado'),
  
  // Timestamp
  criado_em: timestamp('criado_em').defaultNow(),
  atualizado_em: timestamp('atualizado_em').defaultNow(),
}, (table) => ({
  siteIdIdx: index('integracao_config_site_id_idx').on(table.site_id),
  tipoIdx: index('integracao_config_tipo_idx').on(table.tipo_integracao),
}))

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert

export type HealthCheck = typeof healthChecks.$inferSelect
export type NewHealthCheck = typeof healthChecks.$inferInsert

export type Alerta = typeof alertas.$inferSelect
export type NewAlerta = typeof alertas.$inferInsert

export type Notificacao = typeof notificacoes.$inferSelect
export type NewNotificacao = typeof notificacoes.$inferInsert

export type Usuario = typeof usuarios.$inferSelect
export type NewUsuario = typeof usuarios.$inferInsert

export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert

export type IntegracaoConfig = typeof integracaoConfig.$inferSelect
export type NewIntegracaoConfig = typeof integracaoConfig.$inferInsert
