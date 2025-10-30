import * as dotenv from 'dotenv';

// Load environment variables once at startup
dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// Typed, centralized access to environment values used across the backend
export const env = Object.freeze({
  NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
  PORT: parseNumber(process.env.PORT, 3000),
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN),
  ADMIN_API_KEY: (process.env.ADMIN_API_KEY || '').trim(),
  ASSISTANT_API_KEY: (process.env.ASSISTANT_API_KEY || '').trim(),
  AUTH_JWT_SECRET: (process.env.AUTH_JWT_SECRET || '').trim(),
  MASTER_API_KEY: (process.env.MASTER_API_KEY || '').trim(),

  DB_HOST: (process.env.DB_HOST || '127.0.0.1').trim(),
  DB_PORT: Number(process.env.DB_PORT || 3307),
  DB_USER: (process.env.DB_USER || 'root').trim(),
  DB_PASSWORD: process.env.DB_PASSWORD || '123456',
  DB_DATABASE: (process.env.DB_DATABASE || 'bjff_book_locator').trim(),
  DB_CONNECTION_LIMIT: parseNumber(process.env.DB_CONNECTION_LIMIT, 10),
  DB_QUEUE_LIMIT: parseNumber(process.env.DB_QUEUE_LIMIT, 0),

  OPENAI_API_KEY: (process.env.OPENAI_API_KEY ?? '').trim(),
  OPENAI_MODEL: (process.env.OPENAI_MODEL || 'gpt-4.1-mini').trim(),
  OPENAI_TEMPERATURE: parseNumber(process.env.OPENAI_TEMPERATURE, 0.3),
  OPENAI_MAX_OUTPUT_TOKENS: parseNumber(process.env.OPENAI_MAX_OUTPUT_TOKENS, 700),
  CHATBOT_ASSISTANT_NAME: (process.env.CHATBOT_ASSISTANT_NAME || 'Lia').trim(),
  CHATBOT_HANDOFF_CONTACT:
    (process.env.CHATBOT_HANDOFF_CONTACT || 'biblioteca@instituto.edu').trim(),
});

export type Env = typeof env;
