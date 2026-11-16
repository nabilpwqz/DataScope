import { getRawClient } from '../src/lib/db';

async function main() {
  const client = await getRawClient();
  const iterations = 20;
  const latencies: number[] = [];

  console.log(`Running ${iterations} consecutive indexed query flights...`);
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await client.query(`
      SELECT id, record_key, title, status, country, numeric_value
      FROM dataset_records
      WHERE dataset_id = 'ds-sales-01' AND status = 'Active' AND country = 'Germany'
      LIMIT 25 OFFSET ${i * 25};
    `);
    latencies.push(performance.now() - start);
  }

  const avg = (latencies.reduce((a, b) => a + b, 0) / iterations).toFixed(2);
  const min = Math.min(...latencies).toFixed(2);
  const max = Math.max(...latencies).toFixed(2);

  console.log(`=== Stress Test Results (${iterations} iterations) ===`);
  console.log(`Average Latency: ${avg}ms | Min: ${min}ms | Max: ${max}ms`);
  process.exit(0);
}

main();
