import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development') {
    // console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function waitForDatabase(retries = 15, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ PostgreSQL connected successfully');
      return true;
    } catch (err: any) {
      console.log(`⏳ Waiting for PostgreSQL to be ready (${i + 1}/${retries})... ${err.message}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('❌ Failed to connect to PostgreSQL after multiple retries.');
}

