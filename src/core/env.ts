import { config as load } from 'dotenv';
import { z } from 'zod';

load();

/**
 * 유틸 함수
 */
const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');
const trimLeadingSlash = (s: string) => s.replace(/^\/+/, '');
const joinUrl = (a: string, b: string) => `${trimTrailingSlash(a)}/${trimLeadingSlash(b)}`;

/**
 * 환경 변수 스키마
 */
const schema = z.object({
  // DATABASE
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DEV: z.string().url().optional(),

  // PORT
  PORT: z.coerce.number().int().positive().default(3001),
  FE_PORT: z.coerce.number().int().positive().optional(),

  // API ORIGINS
  BASE_URL: z.string().url(),
  BASE_URL_DEV: z.string().url().optional(),

  // FRONT ORIGIN
  FRONT_URL: z.string().url(),
  FRONT_URL_DEV: z.string().url().optional(),

  // FILE URL (S3 기반)
  FILE_BASE_URL: z.string().url().optional(),
  FILE_BASE_URL_DEV: z.string().url().optional(),

  // RUNTIME
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default(''),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  INVITATION_TOKEN_SECRET: z.string().min(10),
  PASSWORD_PEPPER: z.string().min(10),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().min(10),
  AWS_SECRET_ACCESS_KEY: z.string().min(10),
  AWS_REGION: z.string().min(2),
  AWS_S3_BUCKET_NAME: z.string().min(3),
  AWS_S3_BASE_URL: z.string().url(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  for (const i of parsed.error.issues) console.error(`- ${i.path.join('.')}: ${i.message}`);
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

/**
 * RUNTIME FLAGS
 */
export const IS_DEV = env.NODE_ENV === 'development';
export const IS_PROD = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';

/**
 * DATABASE
 */
export const DB_URL = trimTrailingSlash(IS_DEV && env.DATABASE_URL_DEV ? env.DATABASE_URL_DEV : env.DATABASE_URL);

/**
 * API ORIGIN
 */
export const APP_ORIGIN = trimTrailingSlash(IS_DEV && env.BASE_URL_DEV ? env.BASE_URL_DEV : env.BASE_URL);

/**
 * FRONT ORIGIN
 */
export const FRONT_ORIGIN = trimTrailingSlash(IS_DEV && env.FRONT_URL_DEV ? env.FRONT_URL_DEV : env.FRONT_URL);

/**
 * FILE BASE URL (S3 기준)
 */
const rawFileBase = (IS_DEV ? env.FILE_BASE_URL_DEV : env.FILE_BASE_URL) || env.AWS_S3_BASE_URL;
export const FILE_BASE_URL = trimTrailingSlash(rawFileBase);

if (IS_PROD && !FILE_BASE_URL) {
  console.warn('⚠️ FILE_BASE_URL is empty in production. Public file URLs may be broken.');
}

/**
 * CORS ORIGINS
 */
export const CORS_ORIGINS = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (!CORS_ORIGINS.includes(FRONT_ORIGIN)) CORS_ORIGINS.push(FRONT_ORIGIN);

/**
 * AWS S3
 */
export const AWS_CONFIG = {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
  bucketName: env.AWS_S3_BUCKET_NAME,
  baseUrl: env.AWS_S3_BASE_URL,
};

export default env;
