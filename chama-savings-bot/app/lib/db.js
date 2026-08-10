import { Pool } from 'pg';

let pool;

function initializePool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = initializePool();
  return pool.query(text, params);
}

export async function getConnection() {
  const pool = initializePool();
  return pool.connect();
}
