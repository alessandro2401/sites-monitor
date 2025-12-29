# 📋 Guia de Integração dos 10 Sites

## Visão Geral

Este guia fornece instruções passo a passo para integrar os 10 sites ao painel de monitoramento centralizado.

---

## 1. Lista dos 10 Sites

| # | Nome | URL | Tipo | Status |
|---|------|-----|------|--------|
| 1 | Movimento Mais Brasil | https://www.movimentomaisbrasil.org.br | Comunidade | ⏳ |
| 2 | Movimento Mais Seguro | https://www.movimentomaisseguro.com.br | Seguros | ⏳ |
| 3 | Mais Brasil Motorcycle | https://www.maisbrasilmotorcycle.com.br | Seguros | ⏳ |
| 4 | Potere BP Mensal | https://www.poterebpmensal.com.br | Consórcio | ⏳ |
| 5 | Potere Consórcio | https://www.potereconsorcio.com.br | Consórcio | ⏳ |
| 6 | Potere Seguro Auto | https://www.potereseguroauto.com.br | Seguros | ⏳ |
| 7 | Soluções Corretora | https://www.solucoescorretora.com.br | Corretora | ⏳ |
| 8 | Alpha Proteções | https://www.alphaprotecoes.com.br | Seguros | ⏳ |
| 9 | Grupo MMB | https://www.grupommb.com | Holding | ⏳ |
| 10 | Juntos Podemos Mais | https://www.juntospodmais.com.br | Comunidade | ⏳ |

---

## 2. Pré-requisitos

Antes de começar, certifique-se de que:

- ✅ Cada site tem acesso ao seu código-fonte
- ✅ Cada site tem um ambiente de staging para testes
- ✅ Cada site tem acesso a um servidor com Node.js/Python/PHP/Java
- ✅ Cada site tem HTTPS configurado
- ✅ Cada site tem banco de dados acessível
- ✅ Cada site tem cache (Redis) ou pode implementar

---

## 3. Passo 1: Implementar Endpoint `/api/health` em Cada Site

### 3.1 Escolha a Tecnologia

Verifique qual tecnologia cada site usa:

```bash
# Verificar tecnologia via headers HTTP
curl -I https://www.movimentomaisbrasil.org.br

# Procurar por:
# - Server: Express (Node.js)
# - Server: Apache (PHP)
# - Server: Gunicorn (Python)
# - Server: Tomcat (Java)
```

### 3.2 Implementar o Endpoint

Use o template apropriado do arquivo `TEMPLATE_HEALTH_CHECK.md`:

- **Node.js/Express** → Template 1
- **Python/Flask** → Template 2
- **PHP/Laravel** → Template 3
- **Java/Spring Boot** → Template 4

### 3.3 Exemplo: Node.js/Express

```bash
# 1. Copiar template para o projeto
cp TEMPLATE_HEALTH_CHECK.md seu-site/routes/health.js

# 2. Adaptar para o projeto
# - Importar db e redis do projeto
# - Ajustar nomes de variáveis
# - Testar localmente

# 3. Fazer deploy em staging
git add routes/health.js
git commit -m "feat: Add health check endpoint"
git push origin staging

# 4. Testar em staging
curl https://staging.seu-site.com.br/api/health

# 5. Fazer deploy em produção
git push origin main

# 6. Testar em produção
curl https://www.seu-site.com.br/api/health
```

### 3.4 Resposta Esperada

```json
{
  "status": "ok",
  "timestamp": "2025-12-15T16:30:45.123Z",
  "uptime": 3600.5,
  "database": "connected",
  "cache": "connected",
  "ssl": "valid",
  "metrics": {
    "responseTime": 45,
    "errorRate": 0.5,
    "activeConnections": 42
  },
  "version": "1.0.0"
}
```

---

## 4. Passo 2: Testar Conectividade

### 4.1 Teste Manual via cURL

```bash
# Para cada site:
curl -i https://www.seu-site.com.br/api/health

# Verificar:
# - Status HTTP 200 OK
# - JSON válido
# - Campos obrigatórios presentes
# - Tempo de resposta < 1s
```

### 4.2 Teste Automático

```bash
# Executar script de teste
npx tsx scripts/test_connectivity.ts

# Saída esperada:
# ✅ Movimento Mais Brasil - OK (45ms, HTTP 200)
# ✅ Movimento Mais Seguro - OK (52ms, HTTP 200)
# ... (mais 8 sites)
```

### 4.3 Resolver Problemas Comuns

| Problema | Solução |
|----------|---------|
| 404 Not Found | Endpoint não existe - implementar em cada site |
| 500 Internal Server Error | Erro no código - verificar logs do servidor |
| Connection Timeout | Firewall bloqueando - configurar whitelist |
| SSL Certificate Error | Certificado inválido - renovar certificado |
| CORS Error | Política CORS restritiva - adicionar header |

---

## 5. Passo 3: Registrar Sites no Painel

### 5.1 Método Automático (Recomendado)

```bash
# Executar script de registro
npx tsx scripts/register_10_sites.ts

# Saída esperada:
# 🚀 Iniciando registro de 10 sites...
# 📝 Registrando: Movimento Mais Brasil
# ✅ Registrado com sucesso!
# ... (mais 9 sites)
# 🎉 Todos os 10 sites foram registrados com sucesso!
```

### 5.2 Método Manual (Painel Web)

1. Acessar: https://sites.administradoramutual.com.br
2. Fazer login com credenciais admin
3. Clicar em "Novo Site"
4. Preencher formulário:
   - **Nome:** Movimento Mais Brasil
   - **URL:** https://www.movimentomaisbrasil.org.br
   - **Tipo:** Comunidade
   - **Endpoint Health:** https://www.movimentomaisbrasil.org.br/api/health
   - **Email Responsável:** admin@movimentomaisbrasil.org.br
5. Clicar "Criar"
6. Repetir para os 10 sites

### 5.3 Verificar Registro

```bash
# Acessar dashboard
https://sites.administradoramutual.com.br/dashboard

# Verificar:
# - 10 sites aparecem na tabela
# - Status inicial: "Verificando..."
# - Após 1 minuto: Status muda para "Online" ou "Offline"
```

---

## 6. Passo 4: Validar Health Checks

### 6.1 Primeira Verificação

Após registrar os sites, o scheduler vai verificar em 5 minutos:

```
Tempo: 00:00 - Sites registrados
Tempo: 05:00 - Primeira verificação automática
Tempo: 10:00 - Segunda verificação
Tempo: 15:00 - Terceira verificação
...
```

### 6.2 Verificar Resultados

1. Acessar Dashboard: https://sites.administradoramutual.com.br/dashboard
2. Verificar cards de status:
   - **Total de Sites:** 10
   - **Online:** X
   - **Offline:** Y
   - **Degradado:** Z

3. Verificar tabela de sites:
   - Cada site mostra status atual
   - Tempo de resposta
   - Uptime

### 6.3 Resolver Problemas

| Problema | Solução |
|----------|---------|
| Todos os sites "Offline" | Verificar conectividade de rede |
| Alguns sites "Offline" | Verificar endpoint /api/health de cada um |
| Tempo de resposta alto | Otimizar queries do banco de dados |
| Taxa de erro alta | Verificar logs do servidor |

---

## 7. Passo 5: Configurar Alertas

### 7.1 Alertas Automáticos

O sistema já vem com alertas pré-configurados:

| Tipo | Severidade | Ação |
|------|-----------|------|
| Site Offline | CRÍTICA | RED FLAG por email |
| Tempo > 10s | ALTA | Notificação push |
| Taxa erro > 10% | ALTA | Notificação push |
| Tempo > 5s | MÉDIA | Log apenas |
| Taxa erro > 5% | MÉDIA | Log apenas |

### 7.2 Testar Alertas

```bash
# 1. Desligar um site (simular offline)
# Parar o servidor ou bloquear porta

# 2. Aguardar verificação (5 minutos)

# 3. Verificar:
# - Dashboard mostra "Offline"
# - Email RED FLAG recebido em alessandro@pizzolatto.com
# - Alerta aparece em "Alertas" do painel

# 4. Ligar o site novamente

# 5. Aguardar verificação (5 minutos)

# 6. Verificar:
# - Dashboard mostra "Online"
# - Email de recuperação recebido
# - Alerta resolvido automaticamente
```

### 7.3 Customizar Alertas (Futuro)

Você pode customizar limiares em:

```
Dashboard → Gerenciar Sites → [Site] → Configurações
```

---

## 8. Passo 6: Monitoramento Contínuo

### 8.1 Dashboard

Acessar diariamente: https://sites.administradoramutual.com.br/dashboard

Verificar:
- ✅ Status de todos os 10 sites
- ✅ Alertas ativos
- ✅ Tendências de uptime
- ✅ Performance

### 8.2 Relatórios

Gerar relatórios em: Dashboard → Relatórios

Opções:
- Uptime semanal
- Uptime mensal
- Performance por site
- Histórico de alertas

### 8.3 Notificações

Configurar em: Dashboard → Configurações → Notificações

Opções:
- Email para alessandro@pizzolatto.com
- Webhook para Slack
- SMS (futuro)
- WhatsApp (futuro)

---

## 9. Checklist de Integração

### Para Cada Site:

- [ ] Implementar endpoint `/api/health`
- [ ] Testar localmente
- [ ] Fazer deploy em staging
- [ ] Testar em staging
- [ ] Fazer deploy em produção
- [ ] Testar em produção
- [ ] Registrar no painel
- [ ] Validar primeira verificação
- [ ] Testar alertas
- [ ] Documentar configurações

### Geral:

- [ ] Todos os 10 sites registrados
- [ ] Todos os endpoints acessíveis
- [ ] Alertas funcionando
- [ ] RED FLAG por email configurado
- [ ] Dashboard mostrando dados corretos
- [ ] Relatórios funcionando
- [ ] Treinamento de usuários concluído

---

## 10. Troubleshooting

### Problema: "Connection Refused"

```
Causa: Firewall bloqueando conexão
Solução:
1. Verificar firewall do servidor
2. Adicionar IP do painel à whitelist
3. Testar com: telnet seu-site.com.br 443
```

### Problema: "SSL Certificate Error"

```
Causa: Certificado SSL inválido ou expirado
Solução:
1. Verificar certificado: openssl s_client -connect seu-site.com.br:443
2. Renovar certificado se necessário
3. Testar novamente
```

### Problema: "Timeout"

```
Causa: Servidor lento ou não responde
Solução:
1. Verificar performance do servidor
2. Otimizar queries do banco de dados
3. Aumentar timeout (padrão: 10s)
```

### Problema: "Invalid JSON"

```
Causa: Endpoint retorna HTML em vez de JSON
Solução:
1. Verificar endpoint /api/health
2. Garantir que retorna JSON válido
3. Testar com: curl https://seu-site.com.br/api/health | jq
```

---

## 11. Próximas Etapas

1. ✅ Implementar `/api/health` em cada site
2. ✅ Testar conectividade
3. ✅ Registrar sites no painel
4. ✅ Validar health checks
5. ✅ Configurar alertas
6. ⏳ Monitoramento contínuo
7. ⏳ Otimizações de performance
8. ⏳ Relatórios avançados
9. ⏳ Integração com Slack/Teams
10. ⏳ Mobile app

---

## 12. Suporte

Para dúvidas ou problemas:

1. Verificar este guia
2. Consultar `TEMPLATE_HEALTH_CHECK.md`
3. Executar `scripts/test_connectivity.ts`
4. Contatar: alessandro@pizzolatto.com

---

**Versão:** 1.0.0  
**Data:** 15 de Dezembro de 2025  
**Status:** Guia Completo ✅
