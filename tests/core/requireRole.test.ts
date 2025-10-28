import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import { errorHandler } from '#core/middlewares/errorHandler';

describe('[Auth] requireRole (문자열 기반 권한 체크)', () => {
  const app = express();
  app.get(
    '/admin',
    (req, _res, next) => {
      req.user = { id: '1', role: 'USER' };
      next();
    },
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (_req, res) => res.status(200).json({ ok: true })
  );
  app.use(errorHandler);

  it('로그인하지 않은 사용자는 401을 반환해야 함', async () => {
    const noAuthApp = express();
    noAuthApp.get('/admin', requireRole(['ADMIN']));
    noAuthApp.use(errorHandler);

    const res = await request(noAuthApp).get('/admin');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/로그인이 필요/);
  });

  it('권한이 부족한 사용자는 403을 반환해야 함', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/접근 권한/);
  });

  it('허용된 권한이면 접근 가능해야 함', async () => {
    const privilegedApp = express();
    privilegedApp.get(
      '/admin',
      (req, _res, next) => {
        req.user = { id: '2', role: 'ADMIN' };
        next();
      },
      requireRole(['ADMIN', 'SUPER_ADMIN']),
      (_req, res) => res.status(200).json({ ok: true })
    );
    privilegedApp.use(errorHandler);

    const res = await request(privilegedApp).get('/admin');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
