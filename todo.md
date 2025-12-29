# 📋 TODO - Painel de Monitoramento de Sites

## Fase 1: Setup da Infraestrutura ✅ (Concluída)

### Backend Infrastructure
- [x] Criar estrutura de pastas
- [x] Configurar package.json
- [x] Configurar TypeScript
- [x] Configurar Vite
- [x] Configurar Drizzle ORM
- [x] Criar schema do banco de dados (7 tabelas)
- [x] Criar database connection
- [x] Criar query helpers

### Services
- [x] Implementar HealthCheckService
- [x] Implementar AlertEngine
- [x] Implementar NotificationService
- [x] Implementar Scheduler

### tRPC Setup
- [x] Configurar tRPC context
- [x] Criar middleware de autenticação
- [x] Criar middleware de autorização (RBAC)
- [x] Criar tRPC procedures base

### Server
- [x] Criar Express server
- [x] Configurar CORS
- [x] Configurar tRPC middleware
- [x] Implementar health check endpoint
- [x] Implementar error handling

---

## Fase 2: Backend - Routers tRPC ⏳ (Em Progresso)

### Sites Router
- [x] list - Listar todos os sites
- [x] get - Obter detalhes de um site
- [x] create - Criar novo site
- [x] update - Atualizar site
- [x] delete - Deletar site (soft delete)
- [x] test - Testar conexão com site
- [x] statusGeral - Status geral de todos os sites

### Monitoring Router
- [x] statusGeral - Status atual de todos os sites
- [x] historico - Histórico de verificações
- [x] metricas - Métricas agregadas
- [x] graficoUptime - Dados para gráfico de uptime
- [x] graficoTempoResposta - Dados para gráfico de tempo
- [x] graficoDistribuicaoStatus - Distribuição de status
- [x] compararSites - Comparar uptime de múltiplos sites

### Alerts Router
- [x] ativos - Listar alertas ativos
- [x] historico - Histórico de alertas
- [x] porSeveridade - Alertas por severidade
- [x] resolver - Resolver alerta
- [x] estatisticas - Estatísticas de alertas
- [x] porTipo - Alertas por tipo
- [x] criticos - Alertas críticos
- [x] tendencia - Tendência de alertas
- [x] tempoMedioResolucao - Tempo médio de resolução

### Usuarios Router
- [ ] list - Listar usuários
- [ ] create - Criar usuário
- [ ] update - Atualizar usuário
- [ ] delete - Deletar usuário
- [ ] getByRole - Usuários por role

### Configuracoes Router
- [ ] get - Obter configurações
- [ ] update - Atualizar configurações
- [ ] resetar - Resetar para padrão

---

## Fase 3: Frontend - Dashboard ⏳ (Próxima)

### Layout e Navegação
- [ ] Criar layout principal com sidebar
- [ ] Implementar navegação
- [ ] Criar componentes de header e footer
- [ ] Implementar tema (dark/light)

### Dashboard Principal
- [ ] Status geral (cards com números)
- [ ] Alertas recentes (tabela)
- [ ] Gráfico de uptime (últimas 24h)
- [ ] Distribuição de status (pie chart)
- [ ] Últimas ações (activity log)

### Página de Sites
- [ ] Tabela de sites com filtros
- [ ] Botão para criar novo site
- [ ] Modal de criar/editar site
- [ ] Botão de testar conexão
- [ ] Botão de deletar site
- [ ] Detalhes do site (modal)

### Página de Monitoramento
- [ ] Seletor de site
- [ ] Gráfico de uptime
- [ ] Gráfico de tempo de resposta
- [ ] Gráfico de taxa de erro
- [ ] Histórico de verificações (tabela)
- [ ] Comparação de múltiplos sites

### Página de Alertas
- [ ] Tabela de alertas ativos
- [ ] Filtros (severidade, tipo, site)
- [ ] Botão de resolver alerta
- [ ] Histórico de alertas
- [ ] Estatísticas de alertas
- [ ] Gráfico de tendência

### Página de Relatórios
- [ ] Seletor de período
- [ ] Uptime por site
- [ ] Tempo médio de resposta
- [ ] Taxa de erro média
- [ ] Tempo médio de resolução
- [ ] Exportar relatório (PDF/CSV)

### Página de Usuários (Admin)
- [ ] Tabela de usuários
- [ ] Criar usuário
- [ ] Editar usuário
- [ ] Deletar usuário
- [ ] Atribuir roles

### Página de Configurações (Admin)
- [ ] Configurações gerais
- [ ] Configurações de notificações
- [ ] Configurações de email
- [ ] Configurações de alertas

---

## Fase 4: Integração com 10 Sites ⏳ (Próxima)

### Preparação dos Sites
- [ ] Movimento Mais Brasil - Criar endpoint /api/health
- [ ] Movimento Mais Seguro - Criar endpoint /api/health
- [ ] Mais Brasil Motorcycle - Criar endpoint /api/health
- [ ] Potere BP Mensal - Criar endpoint /api/health
- [ ] Potere Consórcio - Criar endpoint /api/health
- [ ] Potere Seguro Auto - Criar endpoint /api/health
- [ ] Soluções Corretora - Criar endpoint /api/health
- [ ] Alpha Proteções - Criar endpoint /api/health
- [ ] Grupo MMB - Criar endpoint /api/health
- [ ] Juntos Podemos Mais - Criar endpoint /api/health

### Registro no Painel
- [ ] Registrar Movimento Mais Brasil
- [ ] Registrar Movimento Mais Seguro
- [ ] Registrar Mais Brasil Motorcycle
- [ ] Registrar Potere BP Mensal
- [ ] Registrar Potere Consórcio
- [ ] Registrar Potere Seguro Auto
- [ ] Registrar Soluções Corretora
- [ ] Registrar Alpha Proteções
- [ ] Registrar Grupo MMB
- [ ] Registrar Juntos Podemos Mais

### Testes
- [ ] Testar health check de cada site
- [ ] Testar alertas funcionando
- [ ] Testar notificações por email
- [ ] Testar dashboard mostrando dados corretos

---

## Fase 5: Testes e Otimização ⏳ (Próxima)

### Testes Unitários
- [ ] Testes do HealthCheckService
- [ ] Testes do AlertEngine
- [ ] Testes do NotificationService
- [ ] Testes dos routers tRPC

### Testes de Integração
- [ ] Fluxo completo de health check
- [ ] Criação e resolução de alertas
- [ ] Envio de notificações
- [ ] Atualização do dashboard

### Testes de Carga
- [ ] Teste com 1000 requisições/segundo
- [ ] Teste com 100 usuários simultâneos
- [ ] Teste de performance do dashboard

### Testes de Segurança
- [ ] Teste de injeção SQL
- [ ] Teste de XSS
- [ ] Teste de CSRF
- [ ] Teste de autenticação e autorização

### Otimização
- [ ] Otimizar queries do banco de dados
- [ ] Implementar caching com Redis
- [ ] Lazy loading no frontend
- [ ] Compressão de assets
- [ ] Minificação de código

---

## Fase 6: Deploy e Validação ⏳ (Próxima)

### Preparação
- [ ] Configurar variáveis de ambiente de produção
- [ ] Criar migrations para produção
- [ ] Configurar backup do banco de dados
- [ ] Configurar SSL/HTTPS

### Staging
- [ ] Deploy em staging
- [ ] Testes finais em staging
- [ ] Validação de performance
- [ ] Validação de segurança

### Produção
- [ ] Deploy em produção
- [ ] Monitorar estabilidade
- [ ] Configurar alertas de produção
- [ ] Documentação final

### Treinamento
- [ ] Preparar documentação para usuários
- [ ] Criar guias de uso
- [ ] Treinar usuários
- [ ] Suporte inicial

---

## Funcionalidades Adicionais

### WebSocket (Real-time)
- [ ] Implementar Socket.io
- [ ] Broadcast de atualizações de status
- [ ] Notificações em tempo real no dashboard
- [ ] Atualização automática de gráficos

### Integrações Externas
- [ ] Integração com Slack (opcional)
- [ ] Integração com Telegram (opcional)
- [ ] Integração com PagerDuty (opcional)

### Relatórios Avançados
- [ ] Relatório semanal por email
- [ ] Relatório mensal consolidado
- [ ] Análise de tendências
- [ ] Previsão de problemas (ML)

### Funcionalidades Dinâmicas
- [ ] Adicionar sites sem redeploy
- [ ] Configurar thresholds por site
- [ ] Criar regras de alerta customizadas
- [ ] Agendar manutenção

---

## Documentação

- [ ] README.md
- [ ] API Documentation
- [ ] Guia de Usuário
- [ ] Guia de Administrador
- [ ] Guia de Troubleshooting
- [ ] Changelog

---

## Notas

- Subdomínio: `sites.administradoramutual.com.br`
- Email de alertas: `alessandro@pizzolatto.com`
- Banco de dados: PostgreSQL
- Stack: React 19 + Node.js + tRPC + PostgreSQL
- Total de sites: 10
- Intervalo de verificação: 5 minutos
- Retenção de alertas: 30 dias

---

**Status Geral:** 🚧 Em Desenvolvimento (Fase 1 Concluída, Fase 2 em Progresso)
**Última Atualização:** 15 de Dezembro de 2025
