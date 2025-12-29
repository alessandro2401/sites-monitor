import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp-up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'], // Taxa de erro < 10%
    'group_duration{group:::dashboard}': ['p(95)<1000'],
    'group_duration{group:::sites_list}': ['p(95)<800'],
    'group_duration{group:::status_geral}': ['p(95)<500'],
  },
};

const BASE_URL = 'https://sites.administradoramutual.com.br';

export default function () {
  // Group 1: Dashboard
  group('dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard`);
    check(res, {
      'Dashboard status 200': (r) => r.status === 200,
      'Dashboard response time < 500ms': (r) => r.timings.duration < 500,
      'Dashboard has content': (r) => r.body.length > 0,
    });
  });

  sleep(1);

  // Group 2: Sites List
  group('sites_list', () => {
    const res = http.get(`${BASE_URL}/api/trpc/sites.list`);
    check(res, {
      'Sites list status 200': (r) => r.status === 200,
      'Sites list response time < 1s': (r) => r.timings.duration < 1000,
      'Sites list is JSON': (r) => r.headers['content-type'].includes('json'),
    });
  });

  sleep(1);

  // Group 3: Status Geral
  group('status_geral', () => {
    const res = http.get(`${BASE_URL}/api/trpc/monitoring.statusGeral`);
    check(res, {
      'Status geral status 200': (r) => r.status === 200,
      'Status geral response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  // Group 4: Alertas
  group('alertas', () => {
    const res = http.get(`${BASE_URL}/api/trpc/alerts.list`);
    check(res, {
      'Alertas status 200': (r) => r.status === 200,
      'Alertas response time < 800ms': (r) => r.timings.duration < 800,
    });
  });

  sleep(1);
}
