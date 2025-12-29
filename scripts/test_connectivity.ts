/**
 * Script para testar conectividade de todos os 10 sites
 * 
 * Uso: npx tsx scripts/test_connectivity.ts
 */

import https from 'https';
import http from 'http';

interface TestResult {
  site: string;
  url: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

const SITES_TO_TEST = [
  {
    nome: 'Movimento Mais Brasil',
    url: 'https://www.movimentomaisbrasil.org.br/api/health',
  },
  {
    nome: 'Movimento Mais Seguro',
    url: 'https://www.movimentomaisseguro.com.br/api/health',
  },
  {
    nome: 'Mais Brasil Motorcycle',
    url: 'https://www.maisbrasilmotorcycle.com.br/api/health',
  },
  {
    nome: 'Potere BP Mensal',
    url: 'https://www.poterebpmensal.com.br/api/health',
  },
  {
    nome: 'Potere Consórcio',
    url: 'https://www.potereconsorcio.com.br/api/health',
  },
  {
    nome: 'Potere Seguro Auto',
    url: 'https://www.potereseguroauto.com.br/api/health',
  },
  {
    nome: 'Soluções Corretora',
    url: 'https://www.solucoescorretora.com.br/api/health',
  },
  {
    nome: 'Alpha Proteções',
    url: 'https://www.alphaprotecoes.com.br/api/health',
  },
  {
    nome: 'Grupo MMB',
    url: 'https://www.grupommb.com/api/health',
  },
  {
    nome: 'Juntos Podemos Mais',
    url: 'https://www.juntospodmais.com.br/api/health',
  },
];

function testUrl(url: string, timeout = 10000): Promise<TestResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            site: url.split('/')[2],
            url,
            status: res.statusCode === 200 ? 'success' : 'error',
            statusCode: res.statusCode,
            responseTime,
          });
        } catch {
          resolve({
            site: url.split('/')[2],
            url,
            status: 'error',
            statusCode: res.statusCode,
            responseTime,
            error: 'Invalid JSON response',
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        site: url.split('/')[2],
        url,
        status: 'timeout',
        error: 'Request timeout',
      });
    });

    req.on('error', (err) => {
      resolve({
        site: url.split('/')[2],
        url,
        status: 'error',
        error: err.message,
      });
    });
  });
}

async function testAllSites() {
  console.log('🧪 Testando conectividade de todos os 10 sites...\n');
  console.log('⏳ Isso pode levar alguns minutos...\n');

  const results: TestResult[] = [];

  for (const site of SITES_TO_TEST) {
    process.stdout.write(`Testando ${site.nome}... `);
    const result = await testUrl(site.url);
    results.push(result);

    if (result.status === 'success') {
      console.log(
        `✅ OK (${result.responseTime}ms, HTTP ${result.statusCode})`
      );
    } else if (result.status === 'timeout') {
      console.log(`⏱️  TIMEOUT (${result.error})`);
    } else {
      console.log(`❌ ERRO (${result.error})`);
    }
  }

  console.log('\n📊 Resumo dos Testes:\n');

  const successful = results.filter((r) => r.status === 'success').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const timeouts = results.filter((r) => r.status === 'timeout').length;

  console.log(`✅ Sucesso: ${successful}/${SITES_TO_TEST.length}`);
  console.log(`❌ Erros: ${errors}/${SITES_TO_TEST.length}`);
  console.log(`⏱️  Timeouts: ${timeouts}/${SITES_TO_TEST.length}`);

  console.log('\n📈 Detalhes:\n');

  results.forEach((result) => {
    const statusIcon =
      result.status === 'success'
        ? '✅'
        : result.status === 'timeout'
          ? '⏱️'
          : '❌';

    console.log(`${statusIcon} ${result.site}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    if (result.statusCode) console.log(`   HTTP: ${result.statusCode}`);
    if (result.responseTime) console.log(`   Tempo: ${result.responseTime}ms`);
    if (result.error) console.log(`   Erro: ${result.error}`);
    console.log();
  });

  console.log('💡 Próximas etapas:');
  console.log('   1. Implementar /api/health em sites com erro');
  console.log('   2. Verificar firewall/CORS se necessário');
  console.log('   3. Executar este script novamente após correções');
  console.log('   4. Registrar sites no painel de monitoramento');
}

// Executar
testAllSites().catch(console.error);
