import { queryRows } from '../config/database';

// Example model usage of the DB connection
export interface ServerTime {
  now: Date;
}

export async function getServerTime(): Promise<ServerTime> {
  const rows = await queryRows<ServerTime>('SELECT NOW() AS now');
  return rows[0];
}
