import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '../server/db';

// Setup global para todos os testes
beforeAll(async () => {
  console.log('🧪 Iniciando suite de testes...');
  // Conectar ao banco de dados
  // Executar migrations
});

afterAll(async () => {
  console.log('✅ Suite de testes concluída');
  // Limpar dados de teste
  // Desconectar do banco
});

beforeEach(async () => {
  // Antes de cada teste
});

afterEach(async () => {
  // Depois de cada teste
});

// Variáveis globais para testes
export const TEST_SITE_ID = 'test-site-1';
export const TEST_USER_ID = 'test-user-1';
export const TEST_ALERT_ID = 'test-alert-1';
