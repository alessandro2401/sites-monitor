/**
 * Script para registrar os 10 sites no painel de monitoramento
 * 
 * Uso: npx tsx scripts/register_10_sites.ts
 */

import { db } from '../server/db';
import { sites as sitesTable } from '../drizzle/schema';

const SITES_TO_REGISTER = [
  {
    nome: 'Movimento Mais Brasil',
    url: 'https://www.movimentomaisbrasil.org.br',
    tipo: 'comunidade' as const,
    endpoint_health: 'https://www.movimentomaisbrasil.org.br/api/health',
    email_responsavel: 'admin@movimentomaisbrasil.org.br',
  },
  {
    nome: 'Movimento Mais Seguro',
    url: 'https://www.movimentomaisseguro.com.br',
    tipo: 'seguros' as const,
    endpoint_health: 'https://www.movimentomaisseguro.com.br/api/health',
    email_responsavel: 'admin@movimentomaisseguro.com.br',
  },
  {
    nome: 'Mais Brasil Motorcycle',
    url: 'https://www.maisbrasilmotorcycle.com.br',
    tipo: 'seguros' as const,
    endpoint_health: 'https://www.maisbrasilmotorcycle.com.br/api/health',
    email_responsavel: 'admin@maisbrasilmotorcycle.com.br',
  },
  {
    nome: 'Potere BP Mensal',
    url: 'https://www.poterebpmensal.com.br',
    tipo: 'consorcio' as const,
    endpoint_health: 'https://www.poterebpmensal.com.br/api/health',
    email_responsavel: 'admin@poterebpmensal.com.br',
  },
  {
    nome: 'Potere Consórcio',
    url: 'https://www.potereconsorcio.com.br',
    tipo: 'consorcio' as const,
    endpoint_health: 'https://www.potereconsorcio.com.br/api/health',
    email_responsavel: 'admin@potereconsorcio.com.br',
  },
  {
    nome: 'Potere Seguro Auto',
    url: 'https://www.potereseguroauto.com.br',
    tipo: 'seguros' as const,
    endpoint_health: 'https://www.potereseguroauto.com.br/api/health',
    email_responsavel: 'admin@potereseguroauto.com.br',
  },
  {
    nome: 'Soluções Corretora',
    url: 'https://www.solucoescorretora.com.br',
    tipo: 'corretora' as const,
    endpoint_health: 'https://www.solucoescorretora.com.br/api/health',
    email_responsavel: 'admin@solucoescorretora.com.br',
  },
  {
    nome: 'Alpha Proteções',
    url: 'https://www.alphaprotecoes.com.br',
    tipo: 'seguros' as const,
    endpoint_health: 'https://www.alphaprotecoes.com.br/api/health',
    email_responsavel: 'admin@alphaprotecoes.com.br',
  },
  {
    nome: 'Grupo MMB',
    url: 'https://www.grupommb.com',
    tipo: 'holding' as const,
    endpoint_health: 'https://www.grupommb.com/api/health',
    email_responsavel: 'admin@grupommb.com',
  },
  {
    nome: 'Juntos Podemos Mais',
    url: 'https://www.juntospodmais.com.br',
    tipo: 'comunidade' as const,
    endpoint_health: 'https://www.juntospodmais.com.br/api/health',
    email_responsavel: 'admin@juntospodmais.com.br',
  },
];

async function registerSites() {
  console.log('🚀 Iniciando registro de 10 sites...\n');

  try {
    for (const site of SITES_TO_REGISTER) {
      console.log(`📝 Registrando: ${site.nome}`);

      // Verificar se site já existe
      const existingSite = await db
        .select()
        .from(sitesTable)
        .where((t) => t.url.eq(site.url))
        .limit(1);

      if (existingSite.length > 0) {
        console.log(`   ⚠️  Site já existe. Pulando...\n`);
        continue;
      }

      // Inserir novo site
      const result = await db.insert(sitesTable).values({
        nome: site.nome,
        url: site.url,
        tipo: site.tipo,
        endpoint_health: site.endpoint_health,
        email_responsavel: site.email_responsavel,
        ativo: true,
        intervalo_verificacao: 300, // 5 minutos
        threshold_tempo_resposta: 10000, // 10 segundos
        threshold_taxa_erro: 10, // 10%
      });

      console.log(`   ✅ Registrado com sucesso!\n`);
    }

    console.log('🎉 Todos os 10 sites foram registrados com sucesso!');
    console.log('\n📊 Próximas etapas:');
    console.log('   1. Verificar se os endpoints /api/health estão acessíveis');
    console.log('   2. Testar health checks manualmente');
    console.log('   3. Validar alertas');
    console.log('   4. Acessar o dashboard em: https://sites.administradoramutual.com.br');
  } catch (error) {
    console.error('❌ Erro ao registrar sites:', error);
    process.exit(1);
  }
}

// Executar
registerSites();
