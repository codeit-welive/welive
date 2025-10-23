import { config as load } from 'dotenv';
import { z } from 'zod';

load();

/**
 * 유틸 함수
 */
const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');

/**
 * RUNTIME FLAGS
 */
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';
const IS_DEV = NODE_ENV === 'development';
const IS_TEST = NODE_ENV === 'test';

/**
 * 환경 변수 스키마
 */
const baseSchema = z.object({
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

  // FILE URL (optional in dev/test)
  FILE_BASE_URL: z.string().url().optional(),
  FILE_BASE_URL_DEV: z.string().url().optional(),

  // RUNTIME
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default(''),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  INVITATION_TOKEN_SECRET: z.string().min(10),
  PASSWORD_PEPPER: z.string().min(10),
});

/**
 * AWS 스키마(production)
 */
const awsSchema = IS_PROD
  ? z.object({
      AWS_ACCESS_KEY_ID: z.string().min(10),
      AWS_SECRET_ACCESS_KEY: z.string().min(10),
      AWS_REGION: z.string().min(2),
      AWS_S3_BUCKET_NAME: z.string().min(3),
      AWS_S3_BASE_URL: z.string().url(),
    })
  : z.object({
      AWS_ACCESS_KEY_ID: z.string().optional(),
      AWS_SECRET_ACCESS_KEY: z.string().optional(),
      AWS_REGION: z.string().optional(),
      AWS_S3_BUCKET_NAME: z.string().optional(),
      AWS_S3_BASE_URL: z.string().optional(),
    });

const schema = baseSchema.merge(awsSchema);

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  for (const i of parsed.error.issues) console.error(`- ${i.path.join('.')}: ${i.message}`);
  throw new Error('Invalid environment variables');
}

const env = parsed.data;

/**
 * DATABASE / ORIGINS
 */
export const DB_URL = IS_DEV && env.DATABASE_URL_DEV ? env.DATABASE_URL_DEV : env.DATABASE_URL;
export const APP_ORIGIN = IS_DEV && env.BASE_URL_DEV ? env.BASE_URL_DEV : env.BASE_URL;
export const FRONT_ORIGIN = IS_DEV && env.FRONT_URL_DEV ? env.FRONT_URL_DEV : env.FRONT_URL;

/**
 * AWS & FILE URL CONFIG
 */
type EnvWithAws = typeof env & {
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET_NAME?: string;
  AWS_S3_BASE_URL?: string;
};

/**
 * FILE URL
 */
const rawFileBase = (IS_DEV ? env.FILE_BASE_URL_DEV : env.FILE_BASE_URL) || (env as EnvWithAws).AWS_S3_BASE_URL;

export const FILE_BASE_URL = rawFileBase
  ? trimTrailingSlash(rawFileBase)
  : IS_PROD
    ? (() => {
        throw new Error('❌ FILE_BASE_URL or AWS_S3_BASE_URL is required in production.');
      })()
    : `http://localhost:${env.PORT}/uploads`;

/**
 * AWS CONFIG (only enabled in production)
 */
export const AWS_CONFIG = IS_PROD
  ? {
      accessKeyId: (env as EnvWithAws).AWS_ACCESS_KEY_ID,
      secretAccessKey: (env as EnvWithAws).AWS_SECRET_ACCESS_KEY,
      region: (env as EnvWithAws).AWS_REGION,
      bucketName: (env as EnvWithAws).AWS_S3_BUCKET_NAME,
      baseUrl: (env as EnvWithAws).AWS_S3_BASE_URL,
      enabled: true,
    }
  : { enabled: false };

/**
 * CORS ORIGINS
 */
export const CORS_ORIGINS = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (!CORS_ORIGINS.includes(FRONT_ORIGIN)) CORS_ORIGINS.push(FRONT_ORIGIN);

export { IS_DEV, IS_PROD, IS_TEST };
export default env;
