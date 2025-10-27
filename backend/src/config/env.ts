import * as dotenv from 'dotenv';

// Load environment variables once at startup
dotenv.config();

// Typed, centralized access to environment values used for DB
export const env = Object.freeze({
  DB_HOST: (process.env.DB_HOST || '127.0.0.1').trim(),
  DB_PORT: Number(process.env.DB_PORT || 3307),
  DB_USER: (process.env.DB_USER || 'root').trim(),
  DB_PASSWORD: process.env.DB_PASSWORD ?? '123456',
  DB_DATABASE: (process.env.DB_DATABASE || 'bjff_book_locator').trim(),
  DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  DB_QUEUE_LIMIT: Number(process.env.DB_QUEUE_LIMIT || 0),
});

export type Env = typeof env;
