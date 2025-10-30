import {
  createPool,
  Pool,
  PoolConnection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from 'mysql2/promise';
import { env } from './env';

// Normalize host: use 127.0.0.1 to avoid IPv6 localhost issues on Windows
const host = env.DB_HOST === 'localhost' ? '127.0.0.1' : env.DB_HOST;

// Shared MySQL connection pool
export const pool: Pool = createPool({
  host,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: env.DB_QUEUE_LIMIT,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Acquire a dedicated connection from the pool
export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

// Execute a simple query using the shared pool or a provided connection
export async function query<T extends RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
  sql: string,
  params?: any[] | Record<string, any>,
  conn?: PoolConnection,
) {
  const runner = conn ?? pool;
  return runner.query<T>(sql, params as any);
}

// Convenience execution that returns only rows with a generic type
export async function queryRows<T = any>(
  sql: string,
  params?: any[] | Record<string, any>,
  conn?: PoolConnection,
): Promise<T[]> {
  const [rows] = await query<RowDataPacket[]>(sql, params, conn);
  return rows as unknown as T[];
}

// Transaction helper wrapper
export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback error
    }
    throw err;
  } finally {
    conn.release();
  }
}

export type { PoolConnection };
