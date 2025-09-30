import { config } from 'dotenv';
import { z } from 'zod';

config({ path: process.env.ENV_FILE ?? '.env.local' });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default('info'),
  APP_NAME: z.string().default('smart-plant-backend'),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  ANALYSIS_API_BASE_URL: z.string().url().default('http://analysis-api:5000'),
  JWT_JWKS_URI: z.string().url(),
  JWT_AUDIENCE: z.string().url(),
  JWT_ISSUER: z.string().url(),
  AUTH_JWKS_URI: z.string().url(),
  AUTH_AUDIENCE: z.string(),
  AUTH_ISSUER: z.string(),
  AUTH_TOKEN_SECRET: z.string().min(16),
  AUTH_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(3600),
  RATE_LIMIT_GENERAL_LIMIT: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_GENERAL_WINDOW_MS: z.coerce.number().int().positive().default(60_000)
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration', parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;
