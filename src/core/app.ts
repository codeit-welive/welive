import dotenv from 'dotenv';
import fs from 'fs';

/**
 * 환경 변수 로드
 */
const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import routes from '#core/router';
import sseRouter from '#core/sse';
import { CORS_ORIGINS } from '#core/env';
import { errorHandler } from '#middlewares/errorHandler';
import ApiError from '#errors/ApiError';

const app: Application = express();

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
        'img-src': ["'self'", 'data:', 'https:', ...(process.env.NODE_ENV !== 'production' ? ['http:', 'blob:'] : [])],
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
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/**
 * Body & Cookie 파서
 */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * API 라우터
 */
app.use('/api', routes);

/**
 * SSE 라우터
 */
app.use('/sse', sseRouter);

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
