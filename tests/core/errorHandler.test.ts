import request from 'supertest';
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import express from 'express';
import ApiError from '#errors/ApiError';
import { errorHandler } from '#middlewares/errorHandler';

describe('[Core] 전역 에러 핸들러', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();

    // 정상 라우트
    app.get('/ok', (_req, res) => res.json({ ok: true }));

    // ApiError 발생 라우트
    app.get('/bad', (_req, _res, next) => next(ApiError.badRequest('테스트 요청 오류', { field: 'name' })));

    // 일반 Error 발생 라우트
    app.get('/crash', (_req, _res, next) => next(new Error('서버 다운')));

    // 404
    app.use((_req, _res, next) => next(ApiError.notFound('라우트 없음')));

    // 전역 에러 핸들러
    app.use(errorHandler);
  });

  it('ApiError 발생 시 상태 코드와 메시지를 반환해야 함', async () => {
    const res = await request(app).get('/bad');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toMatch(/테스트 요청 오류/);
    expect(res.body.error.details).toEqual({ field: 'name' });
  });

  it('일반 Error는 500 상태 코드와 INTERNAL_ERROR 코드를 반환해야 함', async () => {
    const res = await request(app).get('/crash');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('정의되지 않은 라우트는 404를 반환해야 함', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('production 환경에서는 내부 에러 메시지를 숨겨야 함', async () => {
    // 임시 환경
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    const { errorHandler: prodErrorHandler } = require('#middlewares/errorHandler');
    const appProd = express();
    appProd.get('/crash', (_req, _res, next) => next(new Error('서버 다운')));
    appProd.use(prodErrorHandler);

    const res = await request(appProd).get('/crash');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('서버 내부 오류가 발생했습니다.');

    // 환경 복원
    process.env.NODE_ENV = 'test';
  });

  it('development 환경에서는 에러 스택 로그가 콘솔에 출력되어야 함', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';

    const { errorHandler: devErrorHandler } = require('#middlewares/errorHandler');
    const appDev = express();
    appDev.get('/crash', (_req, _res, next) => next(new Error('서버 다운')));
    appDev.use(devErrorHandler);

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await request(appDev).get('/crash');
    expect(spy).toHaveBeenCalled();

    process.env.NODE_ENV = 'test';
  });
});
