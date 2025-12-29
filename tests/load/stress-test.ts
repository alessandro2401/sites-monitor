import http from 'k6/http';
import { check, sleep } from 'k6';

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

const BASE_URL = 'https://sites.administradoramutual.com.br';

export default function () {
  // Teste crítico: Status Geral
  const res = http.get(`${BASE_URL}/api/trpc/monitoring.statusGeral`);

  check(res, {
    'Status 200': (r) => r.status === 200,
    'Response time < 2s': (r) => r.timings.duration < 2000,
    'Not 500 error': (r) => r.status !== 500,
  });

  sleep(0.5);
}
