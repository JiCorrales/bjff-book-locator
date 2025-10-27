import { pool } from '../config/database';
import { env } from '../config/env';

async function main() {
  const start = Date.now();
  try {
    console.log(
      `Trying MySQL -> host=${env.DB_HOST} port=${env.DB_PORT} user=${env.DB_USER} db=${env.DB_DATABASE} password=${env.DB_PASSWORD ? 'SET' : 'EMPTY'}`,
    );
    const [rows] = await pool.query('SELECT 1 AS ok');
    const ms = Date.now() - start;
    console.log(`OK MySQL connected at ${env.DB_HOST}:${env.DB_PORT} db=${env.DB_DATABASE} (${ms}ms)`);
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  }
}

main();
