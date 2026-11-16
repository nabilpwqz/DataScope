import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 VUs (light baseline)
    { duration: '1m', target: 50 },   // Moderate concurrency: 50 VUs
    { duration: '30s', target: 100 }, // Peak load: 100 VUs
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(50)<300', 'p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'], // <1% failure rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const DATASET_ID = 'ds-sales-01';

const HEADERS = {
  'Content-Type': 'application/json',
  // In authenticated tests, pass Bearer or NextAuth session cookie
};

export default function () {
  // Scenario 1: Exact / B-Tree indexed status filter
  {
    const res = http.get(`${BASE_URL}/api/datasets/${DATASET_ID}/records?page=1&pageSize=25&filters=%5B%7B%22field%22%3A%22status%22%2C%22operator%22%3A%22equals%22%2C%22value%22%3A%22Active%22%7D%5D`, {
      headers: HEADERS,
    });
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has records array': (r) => JSON.parse(r.body).records !== undefined,
    });
  }

  sleep(0.5);

  // Scenario 2: Full-Text Search over GIN tsvector
  {
    const res = http.get(`${BASE_URL}/api/datasets/${DATASET_ID}/records?search=Enterprise&searchType=fts&page=1&pageSize=25`, {
      headers: HEADERS,
    });
    check(res, {
      'FTS status is 200': (r) => r.status === 200,
      'FTS records returned': (r) => JSON.parse(r.body).records?.length > 0,
    });
  }

  sleep(0.5);

  // Scenario 3: L1 In-Memory Cache Repeat Hit
  {
    const res = http.get(`${BASE_URL}/api/datasets/${DATASET_ID}/records?search=Enterprise&searchType=fts&page=1&pageSize=25`, {
      headers: HEADERS,
    });
    check(res, {
      'Cache status is 200': (r) => r.status === 200,
      'Cache hit flag true': (r) => JSON.parse(r.body).isCached === true,
    });
  }

  sleep(1);
}

