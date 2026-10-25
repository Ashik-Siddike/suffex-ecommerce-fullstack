import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded even if process.cwd() is different
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

// PostgreSQL Connection Pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('supabase') ||
      process.env.DATABASE_URL.includes('pooler') ||
      process.env.NODE_ENV === 'production')
      ? { rejectUnauthorized: false }
      : undefined,
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Verify database connectivity on boot
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Database Connection Error:', err.message);
  }
  console.log('PostgreSQL Database Connected Successfully via Connection Pool!');
  release();
});

export default pool;
