# 🚀 Plano Completo de Deploy e Validação Final - Fase 6

## Visão Geral

Este documento detalha a estratégia completa de deploy para o painel de monitoramento, incluindo deploy em staging, validação, deploy em produção e plano de rollback.

---

## 1. Checklist Pré-Deploy

### 1.1 Verificações de Código

```bash
# 1. Verificar testes
pnpm test:coverage

# Requisitos:
# - Cobertura >= 80%
# - Todos os testes passando
# - Sem warnings

# 2. Verificar linting
pnpm lint

# Requisitos:
# - Sem erros
# - Sem warnings críticos

# 3. Verificar type checking
pnpm type-check

# Requisitos:
# - Sem erros de tipo
# - Sem any implícito

# 4. Build
pnpm build
pnpm build:server

# Requisitos:
# - Build bem-sucedido
# - Sem warnings
# - Tamanho do bundle aceitável
```

### 1.2 Checklist de Segurança

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Credenciais não commitadas
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] JWT secret configurado
- [ ] Helmet.js headers configurados
- [ ] CSRF protection ativo
- [ ] SQL injection prevention validado
- [ ] XSS prevention validado
- [ ] Autenticação OAuth 2.0 testada
- [ ] RBAC testado
- [ ] Audit logging ativo

### 1.3 Checklist de Performance

- [ ] Response time < 500ms (p95)
- [ ] Taxa de erro < 1%
- [ ] Throughput > 100 req/s
- [ ] CPU < 70%
- [ ] Memória < 70%
- [ ] Database connections < 80%
- [ ] Cache Redis funcionando
- [ ] CDN configurado
- [ ] Compressão gzip ativa
- [ ] Code splitting implementado

### 1.4 Checklist de Banco de Dados

- [ ] Migrations criadas
- [ ] Índices criados
- [ ] Backups configurados
- [ ] Replicação configurada (se aplicável)
- [ ] Connection pooling otimizado
- [ ] Queries otimizadas
- [ ] Vacuum e Analyze executados

### 1.5 Checklist de Documentação

- [ ] README.md atualizado
- [ ] API documentation completa
- [ ] Deployment guide escrito
- [ ] Runbook de operações criado
- [ ] Troubleshooting guide criado
- [ ] Changelog atualizado

---

## 2. Deploy em Staging

### 2.1 Preparação do Ambiente Staging

```bash
# 1. Criar branch de staging
git checkout -b staging
git push origin staging

# 2. Configurar variáveis de ambiente
# Arquivo: .env.staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/sites_monitor_staging
JWT_SECRET=staging-secret-key-change-in-production
NODE_ENV=staging
VITE_API_URL=https://staging-sites.administradoramutual.com.br
SENDGRID_API_KEY=staging-key
REDIS_URL=redis://staging-redis:6379

# 3. Criar arquivo docker-compose.staging.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sites_monitor_staging
      POSTGRES_USER: staging_user
      POSTGRES_PASSWORD: staging_pass
    volumes:
      - postgres_staging:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  redis:
    image: redis:7
    ports:
      - "6380:6379"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://staging_user:staging_pass@postgres:5432/sites_monitor_staging
      REDIS_URL: redis://redis:6379
      NODE_ENV: staging
    ports:
      - "3001:3000"
    depends_on:
      - postgres
      - redis

volumes:
  postgres_staging:
```

### 2.2 Build e Deploy em Staging

```bash
# 1. Build da aplicação
pnpm install
pnpm build
pnpm build:server

# 2. Executar migrations
pnpm db:push

# 3. Seed de dados de teste (opcional)
npx tsx scripts/seed-staging.ts

# 4. Iniciar aplicação
docker-compose -f docker-compose.staging.yml up -d

# 5. Verificar logs
docker-compose -f docker-compose.staging.yml logs -f app

# 6. Aguardar aplicação estar pronta
sleep 10

# 7. Testar health check
curl https://staging-sites.administradoramutual.com.br/api/health
```

### 2.3 Validação em Staging

#### 2.3.1 Testes Funcionais

```bash
# 1. Testar login
curl -X POST https://staging-sites.administradoramutual.com.br/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Testar criar site
curl -X POST https://staging-sites.administradoramutual.com.br/api/trpc/sites.create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome":"Test Site",
    "url":"https://example.com",
    "tipo":"corretora",
    "endpoint_health":"https://example.com/api/health",
    "email_responsavel":"test@example.com"
  }'

# 3. Testar listar sites
curl https://staging-sites.administradoramutual.com.br/api/trpc/sites.list \
  -H "Authorization: Bearer $TOKEN"

# 4. Testar status geral
curl https://staging-sites.administradoramutual.com.br/api/trpc/monitoring.statusGeral \
  -H "Authorization: Bearer $TOKEN"

# 5. Testar alertas
curl https://staging-sites.administradoramutual.com.br/api/trpc/alerts.list \
  -H "Authorization: Bearer $TOKEN"
```

#### 2.3.2 Testes de Performance em Staging

```bash
# Executar testes de carga
pnpm test:load

# Requisitos de sucesso:
# - Response time (p95) < 500ms
# - Taxa de erro < 1%
# - Sem timeouts
```

#### 2.3.3 Testes de Segurança em Staging

```bash
# Executar testes de segurança
pnpm test:security

# Requisitos:
# - Todos os testes passando
# - Sem vulnerabilidades críticas
# - Sem SQL injection
# - Sem XSS
# - Sem CSRF
```

#### 2.3.4 Testes de Integração em Staging

```bash
# Registrar 10 sites de teste
npx tsx scripts/register_10_sites.ts

# Testar health checks
npx tsx scripts/test_connectivity.ts

# Requisitos:
# - Todos os sites respondendo
# - Health checks funcionando
# - Alertas sendo criados
```

#### 2.3.5 Testes de Banco de Dados em Staging

```bash
# 1. Verificar migrations
psql -h staging-db -U staging_user -d sites_monitor_staging -c "\dt"

# 2. Verificar índices
psql -h staging-db -U staging_user -d sites_monitor_staging -c "\di"

# 3. Verificar dados
psql -h staging-db -U staging_user -d sites_monitor_staging -c "SELECT COUNT(*) FROM sites;"

# 4. Testar backup
pg_dump -h staging-db -U staging_user -d sites_monitor_staging > backup_staging.sql

# 5. Testar restore
psql -h staging-db -U staging_user -d sites_monitor_staging_restore < backup_staging.sql
```

#### 2.3.6 Testes de Email em Staging

```bash
# 1. Testar envio de RED FLAG
curl -X POST https://staging-sites.administradoramutual.com.br/api/trpc/system.testEmail \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destinatario":"test@example.com",
    "tipo":"red_flag",
    "siteName":"Test Site"
  }'

# 2. Verificar email recebido
# Verificar em: https://mailtrap.io (ou seu serviço de email)

# 3. Validar conteúdo do email
# - Assunto contém "🚨 RED FLAG"
# - Corpo contém detalhes do site
# - Links funcionam
```

### 2.4 Checklist de Validação em Staging

- [ ] Aplicação iniciou sem erros
- [ ] Health check retorna 200 OK
- [ ] Login funciona
- [ ] Criar site funciona
- [ ] Listar sites funciona
- [ ] Dashboard carrega
- [ ] Alertas funcionam
- [ ] Emails são enviados
- [ ] Testes de carga passam
- [ ] Testes de segurança passam
- [ ] Banco de dados funciona
- [ ] Backups funcionam
- [ ] Logs são gerados
- [ ] Métricas são coletadas
- [ ] Performance aceitável

---

## 3. Deploy em Produção

### 3.1 Preparação para Produção

```bash
# 1. Criar tag de release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 2. Criar release notes
# Arquivo: RELEASE_NOTES_v1.0.0.md
## Version 1.0.0 - Release Notes

### Novas Funcionalidades
- Painel de monitoramento centralizado
- Integração com 10 sites
- Sistema de alertas com RED FLAG por email
- Dashboard em tempo real
- Relatórios de uptime

### Melhorias
- Performance otimizada
- Segurança reforçada
- Testes completos

### Bug Fixes
- Nenhum bug crítico

### Breaking Changes
- Nenhum

# 3. Configurar variáveis de produção
# Arquivo: .env.production
DATABASE_URL=postgresql://user:pass@prod-db:5432/sites_monitor
JWT_SECRET=production-secret-key-very-secure
NODE_ENV=production
VITE_API_URL=https://sites.administradoramutual.com.br
SENDGRID_API_KEY=production-key
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3.2 Estratégia de Deploy em Produção

#### 3.2.1 Blue-Green Deployment

```bash
# 1. Manter ambiente BLUE (atual) rodando
# Ambiente BLUE: sites.administradoramutual.com.br (versão atual)

# 2. Preparar ambiente GREEN (novo)
# Ambiente GREEN: sites-green.administradoramutual.com.br (versão nova)

# 3. Deploy em GREEN
docker-compose -f docker-compose.production.yml up -d --scale app=3

# 4. Testar GREEN
curl https://sites-green.administradoramutual.com.br/api/health

# 5. Executar smoke tests em GREEN
pnpm test:smoke

# 6. Se OK, fazer switch de tráfego
# Atualizar load balancer para apontar para GREEN

# 7. Monitorar BLUE (versão anterior) por 1 hora
# Se problema, fazer rollback para BLUE

# 8. Após 1 hora, desligar BLUE
docker-compose -f docker-compose.production.yml down
```

#### 3.2.2 Canary Deployment

```bash
# 1. Deploy em 10% dos servidores
# Versão nova: 1 servidor
# Versão antiga: 9 servidores

# 2. Monitorar por 30 minutos
# Verificar:
# - Taxa de erro
# - Response time
# - CPU/Memória
# - Logs de erro

# 3. Se OK, aumentar para 50%
# Versão nova: 5 servidores
# Versão antiga: 5 servidores

# 4. Monitorar por 30 minutos

# 5. Se OK, fazer deploy completo (100%)
# Versão nova: 10 servidores
# Versão antiga: 0 servidores

# 6. Se problema em qualquer estágio, rollback
```

### 3.3 Checklist de Deploy em Produção

- [ ] Todos os testes passando
- [ ] Staging validado
- [ ] Backup de produção realizado
- [ ] Plano de rollback pronto
- [ ] Equipe notificada
- [ ] Janela de manutenção agendada
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Logs centralizados
- [ ] Métricas sendo coletadas

### 3.4 Passos de Deploy em Produção

```bash
# 1. Conectar ao servidor de produção
ssh deploy@prod-server.com

# 2. Fazer backup do banco de dados
pg_dump -h prod-db -U prod_user -d sites_monitor > /backups/sites_monitor_$(date +%Y%m%d_%H%M%S).sql

# 3. Fazer backup da aplicação
tar -czf /backups/app_$(date +%Y%m%d_%H%M%S).tar.gz /app

# 4. Parar aplicação (manter BLUE rodando)
# Não parar ainda - usar blue-green

# 5. Pull da versão nova
cd /app-green
git fetch origin
git checkout v1.0.0

# 6. Instalar dependências
pnpm install --frozen-lockfile

# 7. Build
pnpm build
pnpm build:server

# 8. Executar migrations
pnpm db:push

# 9. Iniciar aplicação GREEN
docker-compose -f docker-compose.production.yml up -d

# 10. Aguardar aplicação estar pronta
sleep 30

# 11. Executar smoke tests
pnpm test:smoke

# 12. Se OK, fazer switch de tráfego
# Atualizar load balancer

# 13. Monitorar por 1 hora

# 14. Se OK, desligar BLUE
docker-compose -f docker-compose.production.yml down
```

---

## 4. Validação em Produção

### 4.1 Smoke Tests

```bash
# 1. Health check
curl https://sites.administradoramutual.com.br/api/health

# Esperado: HTTP 200, JSON válido

# 2. Login
curl -X POST https://sites.administradoramutual.com.br/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Esperado: HTTP 200, token JWT

# 3. Dashboard
curl https://sites.administradoramutual.com.br/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Esperado: HTTP 200, HTML válido

# 4. API
curl https://sites.administradoramutual.com.br/api/trpc/sites.list \
  -H "Authorization: Bearer $TOKEN"

# Esperado: HTTP 200, JSON com lista de sites
```

### 4.2 Testes de Produção

```bash
# 1. Testar health checks dos 10 sites
npx tsx scripts/test_connectivity.ts

# 2. Verificar alertas
curl https://sites.administradoramutual.com.br/api/trpc/alerts.list \
  -H "Authorization: Bearer $TOKEN"

# 3. Testar email
# Simular site offline e verificar se RED FLAG é enviado

# 4. Verificar logs
docker logs -f sites-monitor-app

# 5. Verificar métricas
curl https://sites.administradoramutual.com.br/metrics
```

### 4.3 Checklist de Validação em Produção

- [ ] Health check OK
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Sites listam
- [ ] Alertas funcionam
- [ ] Emails são enviados
- [ ] Performance aceitável
- [ ] Logs sendo gerados
- [ ] Métricas sendo coletadas
- [ ] Monitoramento ativo
- [ ] Sem erros críticos
- [ ] Taxa de erro < 1%

---

## 5. Monitoramento Pós-Deploy

### 5.1 Métricas a Monitorar

```
Aplicação:
- Response time (p50, p95, p99)
- Taxa de erro (4xx, 5xx)
- Throughput (req/s)
- Uptime

Infraestrutura:
- CPU
- Memória
- Disco
- Rede

Banco de Dados:
- Conexões ativas
- Queries lentas
- Replicação lag
- Tamanho do banco

Alertas:
- Número de alertas criados
- Taxa de resolução
- Emails enviados
```

### 5.2 Alertas Configurados

```
Crítico (Page):
- Aplicação offline
- Taxa de erro > 5%
- Response time > 2s
- Database desconectado
- Redis desconectado

Alto (Email):
- Response time > 1s
- Taxa de erro > 1%
- CPU > 80%
- Memória > 80%
- Disco > 80%

Médio (Log):
- Response time > 500ms
- Taxa de erro > 0.1%
- CPU > 70%
- Memória > 70%
```

### 5.3 Dashboard de Monitoramento

```
Grafana Dashboard: Sites Monitor Production

Painéis:
1. Status Geral
   - Uptime
   - Taxa de erro
   - Response time

2. Tráfego
   - Requisições por segundo
   - Distribuição por endpoint
   - Distribuição por status code

3. Performance
   - Response time (p50, p95, p99)
   - CPU
   - Memória
   - Disco

4. Banco de Dados
   - Conexões ativas
   - Queries por segundo
   - Queries lentas

5. Alertas
   - Número de alertas
   - Taxa de resolução
   - Alertas por severidade
```

---

## 6. Plano de Rollback

### 6.1 Rollback Automático

```bash
# Se taxa de erro > 5% por 5 minutos consecutivos
# Rollback automático para versão anterior

# 1. Detectar problema
# Prometheus/Grafana detecta taxa de erro > 5%

# 2. Acionar rollback
# Script automático executa:
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --scale app=3

# 3. Restaurar versão anterior
git checkout v0.9.0

# 4. Notificar equipe
# Email para ops@administradoramutual.com.br
```

### 6.2 Rollback Manual

```bash
# Se problema detectado manualmente

# 1. Parar aplicação nova (GREEN)
docker-compose -f docker-compose.production.yml down

# 2. Fazer switch de tráfego para BLUE
# Atualizar load balancer

# 3. Verificar BLUE
curl https://sites.administradoramutual.com.br/api/health

# 4. Se OK, investigar problema em GREEN
# Verificar logs
docker logs sites-monitor-app-green

# 5. Restaurar banco de dados (se necessário)
psql -h prod-db -U prod_user -d sites_monitor < /backups/sites_monitor_backup.sql

# 6. Notificar equipe
# Email com detalhes do problema
```

### 6.3 Rollback de Database

```bash
# Se migration causou problema

# 1. Parar aplicação
docker-compose -f docker-compose.production.yml down

# 2. Restaurar backup anterior
psql -h prod-db -U prod_user -d sites_monitor < /backups/sites_monitor_backup.sql

# 3. Reverter migrations
pnpm db:rollback

# 4. Iniciar aplicação com versão anterior
git checkout v0.9.0
docker-compose -f docker-compose.production.yml up -d

# 5. Verificar
curl https://sites.administradoramutual.com.br/api/health
```

---

## 7. Pós-Deploy

### 7.1 Documentação

- [ ] Atualizar README.md com versão nova
- [ ] Atualizar CHANGELOG.md
- [ ] Documentar breaking changes
- [ ] Documentar novas funcionalidades
- [ ] Atualizar API documentation

### 7.2 Comunicação

- [ ] Notificar stakeholders
- [ ] Enviar release notes
- [ ] Agendar treinamento (se necessário)
- [ ] Publicar blog post (se aplicável)

### 7.3 Monitoramento Contínuo

- [ ] Monitorar por 24 horas
- [ ] Verificar logs regularmente
- [ ] Monitorar métricas
- [ ] Responder a alertas
- [ ] Coletar feedback dos usuários

### 7.4 Próximos Passos

- [ ] Análise pós-deploy
- [ ] Lições aprendidas
- [ ] Melhorias para próximo deploy
- [ ] Planejamento da próxima versão

---

## 8. Troubleshooting Pós-Deploy

### Problema: Aplicação não inicia

```bash
# 1. Verificar logs
docker logs sites-monitor-app

# 2. Verificar variáveis de ambiente
docker exec sites-monitor-app env | grep DATABASE_URL

# 3. Verificar conectividade do banco
docker exec sites-monitor-app psql -h prod-db -U prod_user -d sites_monitor -c "SELECT 1"

# 4. Verificar permissões
docker exec sites-monitor-app ls -la /app

# 5. Rollback
git checkout v0.9.0
docker-compose -f docker-compose.production.yml up -d
```

### Problema: Taxa de erro alta

```bash
# 1. Verificar logs de erro
docker logs sites-monitor-app | grep ERROR

# 2. Verificar status do banco
docker exec sites-monitor-app psql -h prod-db -U prod_user -d sites_monitor -c "SELECT COUNT(*) FROM sites;"

# 3. Verificar status do Redis
docker exec sites-monitor-app redis-cli -h prod-redis ping

# 4. Verificar métricas
curl https://sites.administradoramutual.com.br/metrics

# 5. Se problema persiste, rollback
```

### Problema: Performance degradada

```bash
# 1. Verificar CPU
docker stats sites-monitor-app

# 2. Verificar memória
free -h

# 3. Verificar disco
df -h

# 4. Verificar queries lentas
docker exec sites-monitor-app psql -h prod-db -U prod_user -d sites_monitor -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 5. Otimizar ou rollback
```

---

## 9. Checklist Final de Deploy

### Pré-Deploy
- [ ] Todos os testes passando
- [ ] Code review aprovado
- [ ] Staging validado
- [ ] Backup realizado
- [ ] Plano de rollback pronto
- [ ] Equipe notificada
- [ ] Janela de manutenção agendada

### Durante Deploy
- [ ] Monitoramento ativo
- [ ] Logs sendo observados
- [ ] Smoke tests executados
- [ ] Equipe em standby

### Pós-Deploy
- [ ] Validação completa
- [ ] Monitoramento por 24h
- [ ] Documentação atualizada
- [ ] Stakeholders notificados
- [ ] Análise pós-deploy

---

## 10. Próximas Etapas

1. ✅ Validar staging
2. ✅ Deploy em produção
3. ✅ Validar produção
4. ✅ Monitorar por 24h
5. ⏳ Análise pós-deploy
6. ⏳ Lições aprendidas
7. ⏳ Planejamento da próxima versão

---

**Versão:** 1.0.0  
**Data:** 15 de Dezembro de 2025  
**Status:** Plano Completo ✅
