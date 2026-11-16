import { getRawClient } from '../src/lib/db';

async function main() {
  const start = performance.now();
  console.log('Connecting to PostgreSQL cluster...');
  try {
    const client = await getRawClient();
    const pingRes = await client.query('SELECT NOW() AS server_time, version() AS pg_version;');
    const latency = (performance.now() - start).toFixed(2);
    console.log(`Database connected successfully in ${latency}ms`);
    console.log(`PostgreSQL Version: ${pingRes.rows[0].pg_version}`);
    console.log(`Server Time: ${pingRes.rows[0].server_time}`);
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

main();
