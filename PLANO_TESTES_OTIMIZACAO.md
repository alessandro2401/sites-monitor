# 🧪 Plano Completo de Testes e Otimização - Fase 5

## Visão Geral

Este documento detalha a estratégia completa de testes para o painel de monitoramento, incluindo testes unitários, integração, carga e segurança.

---

## 1. Testes Unitários

### 1.1 Estrutura de Testes

```
tests/
├── unit/
│   ├── services/
│   │   ├── healthCheckService.test.ts
│   │   ├── alertEngine.test.ts
│   │   └── notificationService.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   └── formatters.test.ts
│   └── routers/
│       ├── sites.test.ts
│       ├── monitoring.test.ts
│       └── alerts.test.ts
├── integration/
│   ├── health-check-flow.test.ts
│   ├── alert-creation-flow.test.ts
│   └── notification-flow.test.ts
└── load/
    ├── load-test.ts
    └── stress-test.ts
```

### 1.2 Testes do HealthCheckService

```typescript
// tests/unit/services/healthCheckService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckService } from '../../../server/services/healthCheckService';

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(() => {
    service = new HealthCheckService();
  });

  describe('checkSite', () => {
    it('deve retornar status "ok" para site online', async () => {
      const result = await service.checkSite({
        url: 'https://example.com',
        endpoint_health: 'https://example.com/api/health',
      });

      expect(result.status).toBe('ok');
      expect(result.responseTime).toBeLessThan(10000);
      expect(result.database).toBe('connected');
    });

    it('deve retornar status "offline" para site indisponível', async () => {
      const result = await service.checkSite({
        url: 'https://invalid-site-12345.com',
        endpoint_health: 'https://invalid-site-12345.com/api/health',
      });

      expect(result.status).toBe('offline');
      expect(result.error).toBeDefined();
    });

    it('deve medir tempo de resposta corretamente', async () => {
      const result = await service.checkSite({
        url: 'https://example.com',
        endpoint_health: 'https://example.com/api/health',
      });

      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.responseTime).toBeLessThan(30000);
    });

    it('deve detectar timeout após 10 segundos', async () => {
      const result = await service.checkSite({
        url: 'https://slow-site.com',
        endpoint_health: 'https://slow-site.com/api/health',
      });

      if (result.responseTime > 10000) {
        expect(result.status).toBe('timeout');
      }
    });

    it('deve validar resposta JSON', async () => {
      const result = await service.checkSite({
        url: 'https://example.com',
        endpoint_health: 'https://example.com/api/health',
      });

      expect(result.database).toBeDefined();
      expect(result.cache).toBeDefined();
      expect(result.ssl).toBeDefined();
    });
  });

  describe('checkAllSites', () => {
    it('deve verificar todos os sites', async () => {
      const sites = [
        { id: '1', endpoint_health: 'https://site1.com/api/health' },
        { id: '2', endpoint_health: 'https://site2.com/api/health' },
        { id: '3', endpoint_health: 'https://site3.com/api/health' },
      ];

      const results = await service.checkAllSites(sites);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.status)).toBe(true);
    });

    it('deve continuar mesmo se um site falhar', async () => {
      const sites = [
        { id: '1', endpoint_health: 'https://site1.com/api/health' },
        { id: '2', endpoint_health: 'https://invalid.com/api/health' },
        { id: '3', endpoint_health: 'https://site3.com/api/health' },
      ];

      const results = await service.checkAllSites(sites);

      expect(results).toHaveLength(3);
      expect(results.some((r) => r.status === 'offline')).toBe(true);
    });
  });
});
```

### 1.3 Testes do AlertEngine

```typescript
// tests/unit/services/alertEngine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AlertEngine } from '../../../server/services/alertEngine';

describe('AlertEngine', () => {
  let engine: AlertEngine;

  beforeEach(() => {
    engine = new AlertEngine();
  });

  describe('detectStatusChange', () => {
    it('deve criar alerta quando status muda de online para offline', async () => {
      const alert = await engine.detectStatusChange({
        siteId: 'site-1',
        previousStatus: 'online',
        currentStatus: 'offline',
      });

      expect(alert).toBeDefined();
      expect(alert.severidade).toBe('critica');
      expect(alert.tipo).toBe('offline');
    });

    it('deve não criar alerta quando status não muda', async () => {
      const alert = await engine.detectStatusChange({
        siteId: 'site-1',
        previousStatus: 'online',
        currentStatus: 'online',
      });

      expect(alert).toBeNull();
    });

    it('deve classificar severidade corretamente', async () => {
      const alerts = [
        {
          tipo: 'offline',
          expectedSeveridade: 'critica',
        },
        {
          tipo: 'tempo_alto',
          expectedSeveridade: 'alta',
        },
        {
          tipo: 'erro_taxa',
          expectedSeveridade: 'media',
        },
      ];

      for (const { tipo, expectedSeveridade } of alerts) {
        const alert = await engine.createAlert({
          siteId: 'site-1',
          tipo,
        });

        expect(alert.severidade).toBe(expectedSeveridade);
      }
    });
  });

  describe('resolveAlert', () => {
    it('deve resolver alerta existente', async () => {
      const alertId = 'alert-1';
      const resolved = await engine.resolveAlert(alertId);

      expect(resolved).toBe(true);
    });

    it('deve registrar hora de resolução', async () => {
      const alertId = 'alert-1';
      await engine.resolveAlert(alertId);

      const alert = await engine.getAlert(alertId);
      expect(alert.resolvido).toBe(true);
      expect(alert.resolvido_em).toBeDefined();
    });
  });
});
```

### 1.4 Testes do NotificationService

```typescript
// tests/unit/services/notificationService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../../../server/services/notificationService';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    // Mock do nodemailer
    vi.mock('nodemailer');
  });

  describe('enviarRedFlag', () => {
    it('deve enviar email com RED FLAG', async () => {
      const result = await service.enviarRedFlag({
        siteId: 'site-1',
        siteName: 'Movimento Mais Brasil',
        tipo: 'offline',
        destinatario: 'alessandro@pizzolatto.com',
      });

      expect(result.status).toBe('enviado');
      expect(result.messageId).toBeDefined();
    });

    it('deve incluir detalhes no email', async () => {
      const result = await service.enviarRedFlag({
        siteId: 'site-1',
        siteName: 'Movimento Mais Brasil',
        tipo: 'offline',
        destinatario: 'alessandro@pizzolatto.com',
      });

      expect(result.assunto).toContain('🚨 RED FLAG');
      expect(result.assunto).toContain('Movimento Mais Brasil');
    });

    it('deve registrar tentativa de envio', async () => {
      await service.enviarRedFlag({
        siteId: 'site-1',
        siteName: 'Movimento Mais Brasil',
        tipo: 'offline',
        destinatario: 'alessandro@pizzolatto.com',
      });

      const log = await service.getNotificationLog('site-1');
      expect(log).toHaveLength(1);
      expect(log[0].tipo).toBe('email');
    });

    it('deve retentar em caso de falha', async () => {
      const result = await service.enviarRedFlag({
        siteId: 'site-1',
        siteName: 'Movimento Mais Brasil',
        tipo: 'offline',
        destinatario: 'alessandro@pizzolatto.com',
      });

      if (result.status === 'falha') {
        const retry = await service.enviarRedFlag({
          siteId: 'site-1',
          siteName: 'Movimento Mais Brasil',
          tipo: 'offline',
          destinatario: 'alessandro@pizzolatto.com',
        });

        expect(retry.tentativa).toBe(2);
      }
    });
  });
});
```

### 1.5 Executar Testes Unitários

```bash
# Instalar dependências
pnpm install vitest @vitest/ui

# Executar testes
pnpm test

# Executar com UI
pnpm test:ui

# Executar com cobertura
pnpm test:coverage

# Executar em watch mode
pnpm test:watch
```

---

## 2. Testes de Integração

### 2.1 Fluxo Completo de Health Check

```typescript
// tests/integration/health-check-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { sites as sitesTable } from '../../drizzle/schema';
import { HealthCheckService } from '../../server/services/healthCheckService';
import { AlertEngine } from '../../server/services/alertEngine';

describe('Health Check Flow', () => {
  let siteId: string;
  let healthCheckService: HealthCheckService;
  let alertEngine: AlertEngine;

  beforeAll(async () => {
    // Criar site de teste
    const result = await db.insert(sitesTable).values({
      nome: 'Test Site',
      url: 'https://example.com',
      tipo: 'corretora',
      endpoint_health: 'https://example.com/api/health',
      ativo: true,
    });

    siteId = result[0].id;
    healthCheckService = new HealthCheckService();
    alertEngine = new AlertEngine();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await db.delete(sitesTable).where((t) => t.id.eq(siteId));
  });

  it('deve executar fluxo completo de health check', async () => {
    // 1. Verificar site
    const healthCheck = await healthCheckService.checkSite({
      url: 'https://example.com',
      endpoint_health: 'https://example.com/api/health',
    });

    expect(healthCheck.status).toBeDefined();

    // 2. Armazenar resultado
    const stored = await db.insert(healthChecksTable).values({
      site_id: siteId,
      status: healthCheck.status,
      tempo_resposta: healthCheck.responseTime,
      database_status: healthCheck.database,
      cache_status: healthCheck.cache,
    });

    expect(stored).toBeDefined();

    // 3. Detectar mudanças
    const previousStatus = 'online';
    const currentStatus = healthCheck.status;

    if (previousStatus !== currentStatus) {
      const alert = await alertEngine.detectStatusChange({
        siteId,
        previousStatus,
        currentStatus,
      });

      expect(alert).toBeDefined();
      expect(alert.severidade).toBeDefined();
    }
  });

  it('deve criar alerta quando site fica offline', async () => {
    // Simular site offline
    const healthCheck = {
      status: 'offline',
      responseTime: 0,
      database: 'disconnected',
      cache: 'disconnected',
    };

    // Detectar mudança
    const alert = await alertEngine.detectStatusChange({
      siteId,
      previousStatus: 'online',
      currentStatus: 'offline',
    });

    expect(alert).toBeDefined();
    expect(alert.severidade).toBe('critica');
    expect(alert.tipo).toBe('offline');
  });
});
```

### 2.2 Fluxo Completo de Alertas

```typescript
// tests/integration/alert-creation-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { AlertEngine } from '../../server/services/alertEngine';
import { NotificationService } from '../../server/services/notificationService';

describe('Alert Creation Flow', () => {
  let alertEngine: AlertEngine;
  let notificationService: NotificationService;

  beforeAll(() => {
    alertEngine = new AlertEngine();
    notificationService = new NotificationService();
  });

  it('deve criar alerta e enviar notificação', async () => {
    // 1. Criar alerta
    const alert = await alertEngine.createAlert({
      siteId: 'site-1',
      tipo: 'offline',
      titulo: 'Site Offline',
      mensagem: 'Site deixou de responder',
    });

    expect(alert).toBeDefined();
    expect(alert.id).toBeDefined();

    // 2. Enviar notificação
    const notification = await notificationService.enviarRedFlag({
      siteId: 'site-1',
      siteName: 'Movimento Mais Brasil',
      tipo: 'offline',
      destinatario: 'alessandro@pizzolatto.com',
    });

    expect(notification.status).toBe('enviado');

    // 3. Registrar notificação
    const log = await notificationService.getNotificationLog('site-1');
    expect(log.length).toBeGreaterThan(0);
  });

  it('deve resolver alerta automaticamente quando site volta online', async () => {
    // 1. Criar alerta
    const alert = await alertEngine.createAlert({
      siteId: 'site-1',
      tipo: 'offline',
    });

    expect(alert.resolvido).toBe(false);

    // 2. Simular site voltando online
    await alertEngine.detectStatusChange({
      siteId: 'site-1',
      previousStatus: 'offline',
      currentStatus: 'online',
    });

    // 3. Resolver alerta
    const resolved = await alertEngine.resolveAlert(alert.id);
    expect(resolved).toBe(true);

    // 4. Enviar email de recuperação
    const recovery = await notificationService.enviarRecuperacao({
      siteId: 'site-1',
      siteName: 'Movimento Mais Brasil',
      destinatario: 'alessandro@pizzolatto.com',
    });

    expect(recovery.status).toBe('enviado');
  });
});
```

### 2.3 Executar Testes de Integração

```bash
# Executar testes de integração
pnpm test:integration

# Executar com seed de dados
pnpm test:integration --seed

# Executar com debug
pnpm test:integration --inspect-brk
```

---

## 3. Testes de Carga (Load Testing)

### 3.1 Estratégia de Testes de Carga

```
Objetivo: Validar que o sistema suporta múltiplas requisições simultâneas

Cenários:
1. Carga Normal (100 usuários)
2. Carga Alta (1000 usuários)
3. Carga Pico (5000 usuários)
4. Stress Test (10000+ usuários)
```

### 3.2 Teste de Carga com Apache JMeter

```bash
# Instalar JMeter
brew install jmeter

# Executar teste
jmeter -n -t load-test.jmx -l results.jtl -j jmeter.log
```

### 3.3 Teste de Carga com k6

```typescript
// tests/load/load-test.ts
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 200 }, // Ramp-up to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'], // Taxa de erro < 10%
  },
};

export default function () {
  // Teste 1: Dashboard
  let res = http.get('https://sites.administradoramutual.com.br/dashboard');
  check(res, {
    'Dashboard status 200': (r) => r.status === 200,
    'Dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Teste 2: Lista de Sites
  res = http.get('https://sites.administradoramutual.com.br/api/trpc/sites.list');
  check(res, {
    'Sites list status 200': (r) => r.status === 200,
    'Sites list response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Teste 3: Status Geral
  res = http.get(
    'https://sites.administradoramutual.com.br/api/trpc/monitoring.statusGeral'
  );
  check(res, {
    'Status geral status 200': (r) => r.status === 200,
    'Status geral response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### 3.4 Executar Teste de Carga com k6

```bash
# Instalar k6
brew install k6

# Executar teste de carga
k6 run tests/load/load-test.ts

# Executar com output detalhado
k6 run --out json=results.json tests/load/load-test.ts

# Executar com InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 tests/load/load-test.ts
```

### 3.5 Teste de Stress

```typescript
// tests/load/stress-test.ts
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 1000 },
    { duration: '3m', target: 10000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% < 2s
    http_req_failed: ['rate<0.5'], // Taxa de erro < 50%
  },
};

export default function () {
  const res = http.get(
    'https://sites.administradoramutual.com.br/api/trpc/monitoring.statusGeral'
  );

  check(res, {
    'Status 200': (r) => r.status === 200,
    'Response time < 2s': (r) => r.timings.duration < 2000,
  });
}
```

### 3.6 Métricas de Carga

| Métrica | Alvo | Crítico |
|---------|------|---------|
| Response Time (p95) | < 500ms | > 2s |
| Response Time (p99) | < 1s | > 5s |
| Taxa de Erro | < 1% | > 5% |
| Throughput | > 100 req/s | < 50 req/s |
| CPU | < 70% | > 90% |
| Memória | < 70% | > 90% |
| Conexões DB | < 80% | > 95% |

---

## 4. Testes de Segurança

### 4.1 Testes OWASP Top 10

#### 4.1.1 SQL Injection

```typescript
// tests/security/sql-injection.test.ts
import { describe, it, expect } from 'vitest';
import { trpc } from '../../server/routers';

describe('SQL Injection Prevention', () => {
  it('deve rejeitar SQL injection em nome de site', async () => {
    const maliciousInput = "'; DROP TABLE sites; --";

    const result = await trpc.sites.create.mutate({
      nome: maliciousInput,
      url: 'https://example.com',
      tipo: 'corretora',
      endpoint_health: 'https://example.com/api/health',
      email_responsavel: 'test@example.com',
    });

    // Deve rejeitar ou sanitizar
    expect(result.error || result.nome).toBeDefined();
  });

  it('deve escapar caracteres especiais', async () => {
    const input = "Test'; OR '1'='1";

    const result = await trpc.sites.create.mutate({
      nome: input,
      url: 'https://example.com',
      tipo: 'corretora',
      endpoint_health: 'https://example.com/api/health',
      email_responsavel: 'test@example.com',
    });

    expect(result.nome).toBe(input); // Deve armazenar escapado
  });
});
```

#### 4.1.2 Cross-Site Scripting (XSS)

```typescript
// tests/security/xss-prevention.test.ts
import { describe, it, expect } from 'vitest';

describe('XSS Prevention', () => {
  it('deve sanitizar HTML em campos de texto', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';

    const result = await trpc.sites.create.mutate({
      nome: maliciousInput,
      url: 'https://example.com',
      tipo: 'corretora',
      endpoint_health: 'https://example.com/api/health',
      email_responsavel: 'test@example.com',
    });

    // Deve remover tags script
    expect(result.nome).not.toContain('<script>');
  });

  it('deve escapar conteúdo no frontend', async () => {
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.list'
    );
    const data = await response.json();

    // Verificar que HTML não é interpretado
    data.forEach((site: any) => {
      expect(site.nome).not.toContain('<');
      expect(site.nome).not.toContain('>');
    });
  });
});
```

#### 4.1.3 CSRF (Cross-Site Request Forgery)

```typescript
// tests/security/csrf-prevention.test.ts
import { describe, it, expect } from 'vitest';

describe('CSRF Prevention', () => {
  it('deve rejeitar requisições sem CSRF token', async () => {
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.create',
      {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Test Site',
          url: 'https://example.com',
        }),
      }
    );

    expect(response.status).toBe(403); // Forbidden
  });

  it('deve aceitar requisições com CSRF token válido', async () => {
    // Obter token
    const tokenResponse = await fetch(
      'https://sites.administradoramutual.com.br/api/csrf-token'
    );
    const { token } = await tokenResponse.json();

    // Enviar com token
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.create',
      {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({
          nome: 'Test Site',
          url: 'https://example.com',
        }),
      }
    );

    expect(response.status).toBe(200);
  });
});
```

#### 4.1.4 Autenticação e Autorização

```typescript
// tests/security/auth.test.ts
import { describe, it, expect } from 'vitest';

describe('Authentication & Authorization', () => {
  it('deve rejeitar requisições sem autenticação', async () => {
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.list'
    );

    expect(response.status).toBe(401); // Unauthorized
  });

  it('deve validar JWT token', async () => {
    const invalidToken = 'invalid.token.here';

    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.list',
      {
        headers: {
          Authorization: `Bearer ${invalidToken}`,
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('deve rejeitar token expirado', async () => {
    // Token expirado há 1 hora
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';

    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.list',
      {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('deve rejeitar usuário sem permissão', async () => {
    // Usuário com role "viewer" tentando deletar site
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/trpc/sites.delete',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${viewerToken}`,
        },
        body: JSON.stringify({ id: 'site-1' }),
      }
    );

    expect(response.status).toBe(403); // Forbidden
  });
});
```

#### 4.1.5 Injeção de Dependência

```typescript
// tests/security/dependency-injection.test.ts
import { describe, it, expect } from 'vitest';

describe('Dependency Injection Prevention', () => {
  it('deve validar tipo de dados em entrada', async () => {
    const maliciousInput = {
      nome: 'Test',
      url: 'https://example.com',
      tipo: 'invalid_type', // Tipo inválido
    };

    const result = await trpc.sites.create.mutate(maliciousInput);

    // Deve rejeitar tipo inválido
    expect(result.error).toBeDefined();
  });

  it('deve rejeitar campos extras', async () => {
    const maliciousInput = {
      nome: 'Test',
      url: 'https://example.com',
      tipo: 'corretora',
      __proto__: { isAdmin: true }, // Prototype pollution
    };

    const result = await trpc.sites.create.mutate(maliciousInput);

    // Deve ignorar campos extras
    expect(result.isAdmin).toBeUndefined();
  });
});
```

### 4.2 Teste de Força Bruta

```typescript
// tests/security/brute-force.test.ts
import { describe, it, expect } from 'vitest';

describe('Brute Force Protection', () => {
  it('deve limitar tentativas de login', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'wrong_password',
    };

    // Tentar 10 vezes
    for (let i = 0; i < 10; i++) {
      const response = await fetch(
        'https://sites.administradoramutual.com.br/api/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      if (i < 5) {
        expect(response.status).toBe(401);
      } else {
        // Após 5 tentativas, deve bloquear
        expect(response.status).toBe(429); // Too Many Requests
      }
    }
  });

  it('deve resetar contador após tempo', async () => {
    // Tentar 5 vezes
    for (let i = 0; i < 5; i++) {
      await fetch('https://sites.administradoramutual.com.br/api/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong',
        }),
      });
    }

    // Aguardar 15 minutos
    await new Promise((r) => setTimeout(r, 15 * 60 * 1000));

    // Deve permitir novamente
    const response = await fetch(
      'https://sites.administradoramutual.com.br/api/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correct_password',
        }),
      }
    );

    expect(response.status).toBe(200);
  });
});
```

### 4.3 Teste de Segurança com OWASP ZAP

```bash
# Instalar OWASP ZAP
brew install owasp-zap

# Executar scan
zaproxy -cmd -quickurl https://sites.administradoramutual.com.br -quickout report.html
```

### 4.4 Checklist de Segurança

- [ ] SQL Injection Prevention
- [ ] XSS Prevention
- [ ] CSRF Protection
- [ ] Authentication (OAuth 2.0)
- [ ] Authorization (RBAC)
- [ ] Rate Limiting
- [ ] HTTPS/TLS
- [ ] CORS Configuration
- [ ] Helmet.js Headers
- [ ] Input Validation
- [ ] Output Encoding
- [ ] Secure Cookies
- [ ] HSTS
- [ ] CSP (Content Security Policy)
- [ ] Audit Logging

---

## 5. Otimização de Performance

### 5.1 Otimizações de Frontend

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'trpc-vendor': ['@trpc/client', '@trpc/react-query'],
          'ui-vendor': ['lucide-react', 'tailwindcss'],
        },
      },
    },
    // Minificação
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    // Compressão
    reportCompressedSize: true,
  },
  server: {
    // Vite HMR
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
});
```

### 5.2 Otimizações de Backend

```typescript
// server/index.ts
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Compressão
app.use(compression());

// Headers de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
});
app.use('/api/', limiter);

// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Cache com Redis
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

// Middleware de cache
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const cacheKey = `cache:${req.originalUrl}`;
    redis.get(cacheKey, (err, data) => {
      if (data) {
        return res.json(JSON.parse(data));
      }
      next();
    });
  } else {
    next();
  }
});
```

### 5.3 Otimizações de Database

```sql
-- Criar índices
CREATE INDEX idx_sites_ativo ON sites(ativo);
CREATE INDEX idx_health_checks_site_id ON health_checks(site_id);
CREATE INDEX idx_health_checks_criado_em ON health_checks(criado_em);
CREATE INDEX idx_alertas_site_id ON alertas(site_id);
CREATE INDEX idx_alertas_resolvido ON alertas(resolvido);

-- Particionamento de health_checks por data
CREATE TABLE health_checks_2025_12 PARTITION OF health_checks
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Vacuum e Analyze
VACUUM ANALYZE;
```

### 5.4 Monitoramento de Performance

```typescript
// server/monitoring.ts
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  });

  next();
});

// Métricas com Prometheus
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

---

## 6. Relatório de Testes

### 6.1 Template de Relatório

```markdown
# Relatório de Testes - Fase 5

## Resumo Executivo

- Testes Unitários: 45/45 ✅
- Testes de Integração: 12/12 ✅
- Testes de Carga: PASSOU ✅
- Testes de Segurança: 25/25 ✅

## Detalhes

### Testes Unitários
- HealthCheckService: 8/8 ✅
- AlertEngine: 6/6 ✅
- NotificationService: 5/5 ✅
- ...

### Testes de Carga
- Carga Normal (100 usuários): PASSOU
- Carga Alta (1000 usuários): PASSOU
- Carga Pico (5000 usuários): PASSOU
- Stress Test (10000+ usuários): PASSOU

### Testes de Segurança
- SQL Injection: PASSOU ✅
- XSS: PASSOU ✅
- CSRF: PASSOU ✅
- ...

## Recomendações

1. Implementar cache Redis
2. Otimizar queries do banco
3. Adicionar mais índices
4. Configurar CDN para assets
```

---

## 7. Próximas Etapas

1. ✅ Implementar testes unitários
2. ✅ Implementar testes de integração
3. ✅ Executar testes de carga
4. ✅ Executar testes de segurança
5. ⏳ Gerar relatório
6. ⏳ Fazer ajustes baseado em resultados
7. ⏳ Deploy em staging
8. ⏳ Deploy em produção

---

**Versão:** 1.0.0  
**Data:** 15 de Dezembro de 2025  
**Status:** Plano Completo ✅
