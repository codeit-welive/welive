/**
 * @file #core/env.ts
 * @description 환경 변수 로더 및 검증기
 *
 * @usage
 * 환경 변수는 기본적으로 `env` 객체를 통해 접근하는 것을 권장합니다.
 *
 * ```ts
 * import env from '#core/env';
 * console.log(env.NODE_ENV);
 * console.log(env.BASE_URL);
 * ```
 *
 */

import { config as load } from 'dotenv';
import fs from 'fs';
import { z } from 'zod';

/**
 * dotenv 로드
 */
if (process.env.__DOTENV_LOADED__ !== 'true' && process.env.SKIP_DOTENV !== 'true') {
  if (process.env.NODE_ENV === 'test' && fs.existsSync('.env.test')) {
    load({ path: '.env.test', override: true, quiet: true });
  } else {
    load({ override: true, quiet: true });
  }
  process.env.__DOTENV_LOADED__ = 'true';
}

/**
 * 유틸 함수
 */
const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');
const normalizeOrigin = (s: string) => trimTrailingSlash(s).toLowerCase();

/**
 * RUNTIME FLAGS
 */
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

/**
 * 환경 변수 스키마
 */
const baseSchema = z.object({
  // DATABASE
  DATABASE_URL: z.url(),

  // PORT
  PORT: z.coerce.number().int().positive().default(3001),
  FE_PORT: z.coerce.number().int().positive().optional(),

  // API ORIGINS
  BASE_URL: z.url(),

  // FRONT ORIGIN
  FRONT_URL: z.url(),

  // RUNTIME
  CORS_ORIGIN: z.string().default(''),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  PASSWORD_PEPPER: z.string().min(10),
  DEFAULT_AVATAR_URL: z.url(),
});

/**
 * AWS 스키마(production)
 */
const awsSchema =
  process.env.NODE_ENV === 'test'
    ? z.object({
        AWS_REGION: z.string().optional(),
        AWS_S3_BUCKET_NAME: z.string().optional(),
        AWS_S3_BASE_URL: z.string().optional(),
      })
    : z.object({
        AWS_REGION: z.string().min(2),
        AWS_S3_BUCKET_NAME: z.string().min(3),
        AWS_S3_BASE_URL: z.url(),
      });

/**
 * Parse
 */
const schema = baseSchema.merge(awsSchema);
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  for (const i of parsed.error.issues) console.error(`- ${i.path.join('.')}: ${i.message}`);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  } else {
    throw new Error('Invalid environment variables (test mode)');
  }
}

const env = parsed.data;

/**
 * Environment Resolution
 */
const BASE_URL = env.BASE_URL;
const FRONT_URL = env.FRONT_URL;
const PORT = env.PORT;

const ACCESS_TOKEN_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = env.REFRESH_TOKEN_SECRET;
const PASSWORD_PEPPER = env.PASSWORD_PEPPER;
const DEFAULT_AVATAR_URL = env.DEFAULT_AVATAR_URL;

/**
 * AWS CONFIG
 */
type EnvWithAws = typeof env & {
  AWS_REGION?: string;
  AWS_S3_BUCKET_NAME?: string;
  AWS_S3_BASE_URL?: string;
};

const AWS_CONFIG = {
  region: (env as EnvWithAws).AWS_REGION,
  bucketName: (env as EnvWithAws).AWS_S3_BUCKET_NAME,
  baseUrl: (env as EnvWithAws).AWS_S3_BASE_URL,
  enabled: NODE_ENV !== 'test', // 테스트에서만 비활성
};

/**
 * CORS ORIGINS
 */
const CORS_ORIGINS = Array.from(
  new Set(
    env.CORS_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeOrigin)
  )
);

// FRONT_URL이 명시되어 있고, 목록에 없으면 추가
const normalizedFront = normalizeOrigin(env.FRONT_URL);
if (env.FRONT_URL && !CORS_ORIGINS.includes(normalizedFront)) {
  CORS_ORIGINS.push(normalizedFront);
}

export default {
  NODE_ENV,
  BASE_URL,
  FRONT_URL,
  PORT,
  AWS_CONFIG,
  CORS_ORIGINS,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  PASSWORD_PEPPER,
  DEFAULT_AVATAR_URL,
};
