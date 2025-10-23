/**
 * @file 환경 변수 사용 예시
 * @description
 * #core/env 모듈에서 검증된 환경 변수를 불러와 사용하는 방법입니다.
 * 필요한 값만 개별 import 하거나, env 전체를 기본 import로 가져올 수 있습니다.
 *
 * 예시:
 * ```ts
 * import {
 *   DATABASE_URL,
 *   BASE_URL,
 *   FRONT_URL,
 *   FILE_BASE_URL,
 *   AWS_CONFIG,
 *   CORS_ORIGINS,
 * } from '#core/env';
 *
 * // 또는
 * // import env from '#core/env';
 *
 * console.log('데이터베이스 연결 URL:', DATABASE_URL);
 * console.log('API 서버 ORIGIN:', BASE_URL);
 * console.log('프론트엔드 ORIGIN:', FRONT_URL);
 * console.log('파일 기본 경로:', FILE_BASE_URL);
 * console.log('CORS 허용 목록:', CORS_ORIGINS);
 *
 * if (AWS_CONFIG.enabled) {
 *   console.log('S3 버킷 URL:', AWS_CONFIG.baseUrl);
 * }
 * ```
 */

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

/**
 * 환경 변수 스키마
 */
const baseSchema = z.object({
  // DATABASE
  DATABASE_URL: z.string().url(),

  // PORT
  PORT: z.coerce.number().int().positive().default(3001),
  FE_PORT: z.coerce.number().int().positive().optional(),

  // API ORIGINS
  BASE_URL: z.string().url(),

  // FRONT ORIGIN
  FRONT_URL: z.string().url(),

  // FILE URL (optional in dev/test)
  FILE_BASE_URL: z.string().url().optional(),

  // RUNTIME
  CORS_ORIGIN: z.string().default(''),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
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

export const DATABASE_URL = env.DATABASE_URL;
export const BASE_URL = env.BASE_URL;
export const FRONT_URL = env.FRONT_URL;

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
const rawFileBase = env.FILE_BASE_URL;

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
export const CORS_ORIGINS = [
  ...env.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
];

// FRONT_URL이 명시되어 있고, 목록에 없으면 추가
if (env.FRONT_URL && !CORS_ORIGINS.includes(env.FRONT_URL)) {
  CORS_ORIGINS.push(env.FRONT_URL);
}

export default env;
