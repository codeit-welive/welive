import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import authMiddleware from '#core/middlewares/authMiddleware';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';
import { errorHandler } from '#core/middlewares/errorHandler';

describe('[Auth] authMiddleware', () => {
  const app = express();
  app.use(cookieParser());

  app.get('/protected', authMiddleware, (_req, res) => res.status(200).json({ ok: true }));

  app.use(errorHandler);

  it('토큰이 없으면 401을 반환해야 함', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/로그인이 필요/);
  });

  it('유효한 토큰이면 접근 가능해야 함', async () => {
    const token = generateAccessToken({
      id: 'user-1',
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
    const res = await request(app)
      .get('/protected')
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('위조된 토큰이면 401을 반환해야 함', async () => {
    const res = await request(app).get('/protected').set('Cookie', [`access_token=fake.jwt.token`]);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/Access Token.*유효/);
  });
});
