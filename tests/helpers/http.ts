import request from 'supertest';
import app from '#core/app';
import crypto from 'crypto';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole } from '@prisma/client';

export const api = () => request(app);

/**
 * 테스트용 JWT 직접 발급
 */
export const generateTestToken = (id = 'test-user', role: UserRole = UserRole.USER) =>
  generateAccessToken({ id, role });

/**
 * 회원가입 + 로그인 후 토큰 반환
 */
export const signupAndLogin = async (opts?: { email?: string; password?: string; nickname?: string }) => {
  const unique = crypto.randomUUID().slice(0, 8);
  const email = opts?.email ?? `u${unique}@test.com`;
  const password = opts?.password ?? 'password1!';
  const nickname = opts?.nickname ?? `n${unique}`;

  // prettier-ignore
  await api()
    .post('/auth/signup')
    .send({ email, password, nickname })
    .expect(201);

  // prettier-ignore
  const { body } = await api()
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: body.accessToken as string,
    refreshToken: body.refreshToken as string,
    email,
    password,
    nickname,
  };
};
