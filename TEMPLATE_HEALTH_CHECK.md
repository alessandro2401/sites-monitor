# 🏥 Template de Endpoint `/api/health` para os 10 Sites

## Visão Geral

Cada site precisa expor um endpoint `/api/health` que retorna o status de saúde da aplicação. Este template fornece exemplos para diferentes tecnologias.

---

## 1. Template Node.js/Express

```javascript
// routes/health.js
import express from 'express';
import { db } from '../db.js';
import { redis } from '../cache.js';

const router = express.Router();

router.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Verificar banco de dados
    let databaseStatus = 'disconnected';
    try {
      await db.query('SELECT 1');
      databaseStatus = 'connected';
    } catch (err) {
      console.error('Database error:', err);
    }
    
    // Verificar cache (Redis)
    let cacheStatus = 'disconnected';
    try {
      await redis.ping();
      cacheStatus = 'connected';
    } catch (err) {
      console.error('Cache error:', err);
    }
    
    // Verificar SSL
    let sslStatus = 'invalid';
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      sslStatus = 'valid';
    }
    
    // Calcular tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Taxa de erro (exemplo: últimas 100 requisições)
    const errorRate = 0.5; // Implementar lógica real
    
    // Status geral
    const status = databaseStatus === 'connected' && cacheStatus === 'connected' 
      ? 'ok' 
      : 'degraded';
    
    res.json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      cache: cacheStatus,
      ssl: sslStatus,
      metrics: {
        responseTime,
        errorRate,
        activeConnections: 42, // Implementar contagem real
      },
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
```

**Integração no Express:**

```javascript
// app.js
import healthRouter from './routes/health.js';

app.use(healthRouter);
```

---

## 2. Template Python/Flask

```python
# routes/health.py
from flask import Blueprint, jsonify
from datetime import datetime
import time
from app import db, redis_client

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    start_time = time.time()
    
    # Verificar banco de dados
    database_status = 'disconnected'
    try:
        db.session.execute('SELECT 1')
        database_status = 'connected'
    except Exception as e:
        print(f'Database error: {e}')
    
    # Verificar cache (Redis)
    cache_status = 'disconnected'
    try:
        redis_client.ping()
        cache_status = 'connected'
    except Exception as e:
        print(f'Cache error: {e}')
    
    # Verificar SSL
    ssl_status = 'valid'  # Implementar verificação real
    
    # Calcular tempo de resposta
    response_time = (time.time() - start_time) * 1000
    
    # Taxa de erro
    error_rate = 0.5  # Implementar lógica real
    
    # Status geral
    status = 'ok' if database_status == 'connected' and cache_status == 'connected' else 'degraded'
    
    return jsonify({
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'uptime': time.time(),  # Implementar uptime real
        'database': database_status,
        'cache': cache_status,
        'ssl': ssl_status,
        'metrics': {
            'responseTime': response_time,
            'errorRate': error_rate,
            'activeConnections': 42,
        },
        'version': '1.0.0',
    }), 200
```

**Integração no Flask:**

```python
# app.py
from routes.health import health_bp

app.register_blueprint(health_bp)
```

---

## 3. Template PHP/Laravel

```php
// routes/api.php
Route::get('/api/health', function () {
    $startTime = microtime(true);
    
    // Verificar banco de dados
    $databaseStatus = 'disconnected';
    try {
        DB::connection()->getPdo();
        $databaseStatus = 'connected';
    } catch (\Exception $e) {
        \Log::error('Database error: ' . $e->getMessage());
    }
    
    // Verificar cache (Redis)
    $cacheStatus = 'disconnected';
    try {
        Cache::connection('redis')->get('test');
        $cacheStatus = 'connected';
    } catch (\Exception $e) {
        \Log::error('Cache error: ' . $e->getMessage());
    }
    
    // Verificar SSL
    $sslStatus = request()->secure() ? 'valid' : 'invalid';
    
    // Calcular tempo de resposta
    $responseTime = (microtime(true) - $startTime) * 1000;
    
    // Taxa de erro
    $errorRate = 0.5; // Implementar lógica real
    
    // Status geral
    $status = ($databaseStatus === 'connected' && $cacheStatus === 'connected') 
        ? 'ok' 
        : 'degraded';
    
    return response()->json([
        'status' => $status,
        'timestamp' => now()->toIso8601String(),
        'uptime' => time() - $_SERVER['REQUEST_TIME'],
        'database' => $databaseStatus,
        'cache' => $cacheStatus,
        'ssl' => $sslStatus,
        'metrics' => [
            'responseTime' => $responseTime,
            'errorRate' => $errorRate,
            'activeConnections' => 42,
        ],
        'version' => '1.0.0',
    ]);
});
```

---

## 4. Template Java/Spring Boot

```java
// controller/HealthController.java
package com.example.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private HealthEndpoint healthEndpoint;
    
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        long startTime = System.currentTimeMillis();
        
        // Verificar banco de dados
        String databaseStatus = "disconnected";
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            databaseStatus = "connected";
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Verificar cache (Redis)
        String cacheStatus = "disconnected";
        try {
            // Implementar verificação real
            cacheStatus = "connected";
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Verificar SSL
        String sslStatus = "valid";
        
        // Calcular tempo de resposta
        long responseTime = System.currentTimeMillis() - startTime;
        
        // Taxa de erro
        double errorRate = 0.5;
        
        // Status geral
        String status = (databaseStatus.equals("connected") && cacheStatus.equals("connected"))
            ? "ok"
            : "degraded";
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("timestamp", Instant.now().toString());
        response.put("uptime", System.currentTimeMillis() / 1000);
        response.put("database", databaseStatus);
        response.put("cache", cacheStatus);
        response.put("ssl", sslStatus);
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("responseTime", responseTime);
        metrics.put("errorRate", errorRate);
        metrics.put("activeConnections", 42);
        response.put("metrics", metrics);
        
        response.put("version", "1.0.0");
        
        return response;
    }
}
```

---

## 5. Resposta Esperada (JSON)

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

### Campos Obrigatórios:
- `status` (ok | degraded | error)
- `timestamp` (ISO 8601)
- `database` (connected | disconnected)
- `cache` (connected | disconnected)
- `ssl` (valid | invalid)

### Campos Opcionais:
- `uptime` (segundos)
- `metrics` (objeto com métricas)
- `version` (versão da API)

---

## 6. Testes do Endpoint

### Teste via cURL

```bash
# Teste básico
curl -i https://seu-site.com.br/api/health

# Teste com timeout
curl -m 5 https://seu-site.com.br/api/health

# Teste com headers customizados
curl -H "Authorization: Bearer token" https://seu-site.com.br/api/health
```

### Teste via JavaScript

```javascript
async function testHealthEndpoint(url) {
  try {
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (!response.ok) {
      console.error(`HTTP ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log('Health check:', data);
    
    // Validar campos obrigatórios
    if (!data.status || !data.database || !data.cache) {
      console.error('Resposta inválida: campos obrigatórios faltando');
    }
  } catch (error) {
    console.error('Erro ao testar endpoint:', error);
  }
}

// Usar
testHealthEndpoint('https://movimentomaisbrasil.org.br');
```

---

## 7. Checklist de Implementação

Para cada site, execute:

- [ ] Criar arquivo de rota `/api/health`
- [ ] Implementar verificações de banco de dados
- [ ] Implementar verificações de cache
- [ ] Implementar verificações de SSL
- [ ] Testar endpoint localmente
- [ ] Testar endpoint em staging
- [ ] Testar endpoint em produção
- [ ] Documentar URL do endpoint
- [ ] Registrar no painel de monitoramento
- [ ] Validar alertas

---

## 8. Segurança

### Autenticação (Opcional)

Se o endpoint precisar de autenticação:

```javascript
// Exemplo: API Key
router.get('/api/health', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.HEALTH_CHECK_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // ... resto do código
});
```

### Rate Limiting (Recomendado)

```javascript
import rateLimit from 'express-rate-limit';

const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
});

router.get('/api/health', healthLimiter, (req, res) => {
  // ... código do health check
});
```

---

## 9. Monitoramento do Endpoint

O painel vai verificar:

- ✅ Disponibilidade (responde em < 10s)
- ✅ Status HTTP (200 OK)
- ✅ Tempo de resposta (< 1s ideal)
- ✅ Banco de dados (connected)
- ✅ Cache (connected)
- ✅ SSL (valid)
- ✅ Taxa de erro (< 5%)

---

## 10. Próximas Etapas

1. Implementar endpoint em cada site
2. Testar localmente
3. Fazer deploy em produção
4. Registrar sites no painel
5. Validar health checks
6. Configurar alertas

---

**Versão:** 1.0.0  
**Data:** 15 de Dezembro de 2025  
**Status:** Template Pronto para Implementação ✅
