# 🚀 Painel de Monitoramento Centralizado de Sites

Sistema completo de monitoramento centralizado para gerenciar e monitorar múltiplos sites com alertas automáticos, dashboards em tempo real e relatórios consolidados.

## 📋 Características

- ✅ **Monitoramento em Tempo Real** - Verificação automática de saúde dos sites a cada 5 minutos
- ✅ **Alertas Inteligentes** - Sistema de alertas com severidade (crítica, alta, média, baixa)
- ✅ **RED FLAG por Email** - Notificações imediatas para problemas críticos
- ✅ **Dashboard Interativo** - Visualização completa do status de todos os sites
- ✅ **Relatórios Consolidados** - Análise de uptime, performance e incidentes
- ✅ **Adicionar Sites Dinamicamente** - Interface para adicionar novos sites sem redeploy
- ✅ **Autenticação OAuth** - Integração com Manus OAuth
- ✅ **RBAC** - Controle de acesso por roles (Admin, Monitor, Viewer)
- ✅ **Auditoria Completa** - Log de todas as ações no sistema

## 🏗️ Arquitetura

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19 + Tailwind 4 + shadcn/ui |
| **Backend** | Node.js + Express + tRPC |
| **Database** | PostgreSQL + Drizzle ORM |
| **Cache** | Redis (opcional) |
| **Real-time** | WebSocket + Socket.io |
| **Scheduler** | node-cron |
| **Email** | Nodemailer + SendGrid |

### Componentes Principais

1. **Health Check Service** - Verifica status de cada site
2. **Alert Engine** - Classifica e gerencia alertas
3. **Notification Service** - Envia notificações por email
4. **Scheduler** - Executa tarefas agendadas
5. **tRPC API** - API type-safe para frontend

## 📦 Sites Monitorados

| # | Site | URL | Tipo | Status |
|---|------|-----|------|--------|
| 1 | Movimento Mais Brasil | https://www.movimentomaisbrasil.org.br/ | Corretora | ⏳ |
| 2 | Movimento Mais Seguro | https://www.movimentomaisseguro.com.br/ | Corretora | ⏳ |
| 3 | Mais Brasil Motorcycle | https://www.maisbrasilmotorcycle.com.br/ | Corretora | ⏳ |
| 4 | Potere BP Mensal | https://www.poterebpmensal.com.br/ | Consórcio | ⏳ |
| 5 | Potere Consórcio | https://www.potereconsorcio.com.br/ | Consórcio | ⏳ |
| 6 | Potere Seguro Auto | https://potereseguroauto.com.br/ | Seguros | ⏳ |
| 7 | Soluções Corretora | https://www.solucoescorretora.com.br/ | Corretora | ⏳ |
| 8 | Alpha Proteções | https://www.alphaprotecoes.com.br/ | Seguros | ⏳ |
| 9 | Grupo MMB | https://www.grupommb.com/ | Holding | ⏳ |
| 10 | Juntos Podemos Mais | https://www.juntospodmais.com.br/ | Comunidade | ⏳ |

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou pnpm

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd sites-monitor

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Criar banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Estrutura de Pastas

```
sites-monitor/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas
│   │   ├── components/    # Componentes
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── App.tsx        # Roteamento
│   ├── index.html
│   └── vite.config.ts
├── server/                 # Backend Node.js
│   ├── services/          # Serviços de negócio
│   │   ├── healthCheckService.ts
│   │   ├── alertEngine.ts
│   │   └── notificationService.ts
│   ├── routers/           # tRPC routers
│   │   ├── sites.ts
│   │   ├── monitoring.ts
│   │   └── alerts.ts
│   ├── scheduler.ts       # Agendador de tarefas
│   ├── trpc.ts            # Configuração tRPC
│   ├── routers.ts         # Router principal
│   └── index.ts           # Servidor Express
├── drizzle/               # Database
│   ├── schema.ts          # Definição de tabelas
│   └── migrations/        # Migrações
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sites_monitor

# Server
PORT=3000
NODE_ENV=development

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
ALERT_EMAIL=alessandro@pizzolatto.com

# OAuth
VITE_APP_ID=seu-app-id
JWT_SECRET=seu-jwt-secret
```

## 📊 API Endpoints

### Sites

```typescript
// Listar todos os sites
GET /api/trpc/sites.list

// Criar novo site
POST /api/trpc/sites.create
{
  "nome": "Meu Site",
  "url": "https://meusite.com.br",
  "tipo": "corretora",
  "endpoint_health": "https://meusite.com.br/api/health"
}

// Testar conexão
POST /api/trpc/sites.test
{ "id": "uuid-do-site" }
```

### Monitoramento

```typescript
// Status geral
GET /api/trpc/monitoring.statusGeral

// Histórico de verificações
GET /api/trpc/monitoring.historico
{ "siteId": "uuid", "horas": 24 }

// Métricas agregadas
GET /api/trpc/monitoring.metricas
{ "siteId": "uuid", "periodo": "24h" }
```

### Alertas

```typescript
// Alertas ativos
GET /api/trpc/alerts.ativos

// Resolver alerta
POST /api/trpc/alerts.resolver
{ "id": "uuid-do-alerta" }

// Estatísticas
GET /api/trpc/alerts.estatisticas
{ "periodo": "24h" }
```

## 🔔 Sistema de Alertas

### Severidades

| Severidade | Descrição | Ação |
|-----------|-----------|------|
| 🔴 Crítica | Site offline ou erro crítico | RED FLAG imediata por email |
| 🟠 Alta | Tempo alto ou taxa de erro alta | Notificação com delay 5 min |
| 🟡 Média | Degradação de performance | Push notification |
| 🟢 Baixa | Avisos informativos | Log apenas |

### RED FLAG por Email

Quando um alerta crítico é detectado:
1. Email enviado imediatamente para `alessandro@pizzolatto.com`
2. Assunto com 🚨 RED FLAG
3. Detalhes completos do problema
4. Link direto para o painel
5. Recomendações de ação

## 📈 Dashboards

### Dashboard Principal
- Status geral de todos os sites
- Alertas recentes
- Gráficos de uptime
- Distribuição de status

### Detalhes do Site
- Histórico de verificações
- Gráficos de tempo de resposta
- Taxa de erro
- Componentes (DB, Cache, SSL)

### Relatórios
- Uptime por período
- Tempo médio de resposta
- Taxa de erro média
- Tempo médio de resolução de alertas

## 🔐 Segurança

- ✅ HTTPS obrigatório
- ✅ OAuth 2.0 + JWT
- ✅ RBAC (Admin, Monitor, Viewer)
- ✅ Criptografia de dados sensíveis
- ✅ Audit logging completo
- ✅ Rate limiting
- ✅ CORS configurado

## 📋 Tarefas Agendadas

| Tarefa | Frequência | Descrição |
|--------|-----------|-----------|
| Health Check | A cada 5 min | Verifica saúde de todos os sites |
| Processar Alertas | A cada 1 min | Processa alertas pendentes |
| Escalonar Alertas | A cada 30 min | Escalona alertas críticos não resolvidos |
| Limpar Alertas | Diariamente 2 AM | Remove alertas antigos (>30 dias) |

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes de integração
pnpm test:integration

# Cobertura
pnpm test:coverage
```

## 📚 Documentação

- [Plano de Integração](./PLANO_INTEGRACAO_COMPLETO_9SITES.md)
- [Arquitetura Técnica](./ARQUITETURA_CONSOLIDACAO.md)
- [Sistema de RED FLAG](./SISTEMA_RED_FLAG_EMAIL.md)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com o time de desenvolvimento.

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Status:** 🚧 Em Desenvolvimento
**Versão:** 1.0.0
**Última Atualização:** 15 de Dezembro de 2025
