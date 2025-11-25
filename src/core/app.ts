/**
 * @file app.ts
 * @description Express 애플리케이션 초기화 및 전역 미들웨어 구성
 *
 * @architecture
 * - 보안 중심 구성(Helmet, HPP, RateLimit)
 * - CORS 화이트리스트 기반
 * - gzip 압축 및 HTTP 로깅(pino + morgan)
 * - Swagger 문서 로드 (빌드 시 생성된 swagger.json 사용)
 *
 * @routing
 * - dev/test: 모든 API 경로에 `/api` 프리픽스 적용
 * - prod: 프리픽스 제거 (역프록시 레이어에서 직접 노출)
 *
 * @order 중요성
 * 1) 전역 보안 미들웨어 (helmet, hpp)
 * 2) 네트워크/프록시 설정 (trust proxy)
 * 3) 요청 제한(rate-limit)
 * 4) 압축(compression) 및 CORS
 * 5) HTTP 로깅
 * 6) Body Parsing
 * 7) API_PREFIX 적용 (prod는 `/api` 없음)
 * 8) 라우터(routes) 연결
 * 9) Swagger 문서 연결
 * 10) 404 → 글로벌 에러 핸들러
 *
 * @notes
 * - Swagger 문서가 없으면 서버를 중단해 빠르게 오류 확인
 * - API Prefix는 배포 환경에서 경로 단순화 목적
 * - 모든 설정과 순서는 보안·성능·일관성을 기준으로 설계됨
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

import env from '#core/env';
import routes from '#core/router';
import { logger } from '#core/logger';
import corsMiddleware from '#core/middlewares/cors';
import httpLogger from '#core/httpLogger';
import { errorHandler } from '#middlewares/errorHandler';
import ApiError from '#errors/ApiError';

const app: Application = express();

const swaggerPath = path.join(process.cwd(), 'swagger', 'swagger.json');
if (!fs.existsSync(swaggerPath)) {
  logger.system.warn('❌ Swagger 문서가 존재하지 않습니다. 먼저 swagger:generate 스크립트를 실행하세요.');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDoc = require(swaggerPath);

/**
 * 보안/기본 설정
 */
app.disable('x-powered-by');
app.set('etag', false);

/**
 * Helmet 보안 헤더 (CSP 포함)
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', ...(env.NODE_ENV !== 'production' ? ['http:', 'blob:'] : [])],
        'object-src': ["'none'"],
        'frame-ancestors': ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * HPP (HTTP Parameter Pollution 방지)
 */
app.use(hpp());

/**
 * 프록시 신뢰 설정
 */
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

/**
 * 요청 제한 (Rate Limit)
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/**
 * Compression (gzip)
 * - API 응답을 자동 압축
 * - 정적 파일은 Express static이 알아서 압축 캐싱 처리함
 */
app.use(compression());

/**
 * CORS (화이트리스트 기반)
 */
app.use(corsMiddleware);

/**
 * Preflight 처리
 * - prod 전용
 */
if (env.NODE_ENV === 'production') {
  app.options(/.*/, corsMiddleware);
}

/**
 * HTTP 요청 로거 (morgan + pino)
 */
app.use(httpLogger);

/**
 * Body & Cookie 파서
 */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * API Prefix
 * - prod: none
 * - dev/test: /api
 */
const API_PREFIX = env.NODE_ENV === 'production' ? '' : '/api';

/**
 * API 라우터
 */
app.use(API_PREFIX, routes);

/**
 * Swagger
 */
app.use(
  `${API_PREFIX}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDoc, {
    explorer: true,
    customSiteTitle: 'WeLive API Docs',
  })
);

/**
 * 404 핸들러
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Not Found - ${req.originalUrl}`));
});

/**
 * 글로벌 에러 핸들러
 */
app.use(errorHandler);

export default app;
