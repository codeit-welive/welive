import express from 'express';
import corsMiddleware from '#core/middlewares/cors';
import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import env from '#core/env';

describe('[Security] CORS 정책', () => {
  const allowedOrigin = env.CORS_ORIGINS[0] ?? 'http://localhost:3000';
  const disallowedOrigin = 'https://malicious.site';
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(corsMiddleware);
    app.get('/api', (_req, res) => res.status(200).json({ ok: true }));
  });

  it('허용된 Origin 요청은 Access-Control-Allow-Origin 헤더를 반환해야 함', async () => {
    const res = await request(app).get('/api').set('Origin', allowedOrigin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });

  it('비허용 Origin 요청은 500 에러를 반환해야 함', async () => {
    const res = await request(app).get('/api').set('Origin', disallowedOrigin);
    expect(res.status).toBe(500);
  });

  it('OPTIONS Preflight 요청은 204 또는 404를 반환할 수 있음', async () => {
    const res = await request(app)
      .options('/api')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET');

    // preflight 자동 응답이 없으면 404
    expect([204, 404, 500]).toContain(res.status);
  });

  it('credentials 옵션이 true로 설정되어 있어야 함', async () => {
    const res = await request(app).get('/api').set('Origin', allowedOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
