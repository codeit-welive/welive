import { describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '#modules/auth/utils/tokenUtils';
import env from '#core/env';
import { UserRole, JoinStatus } from '@prisma/client';

describe('[Auth] tokenUtils', () => {
  const user = { id: '1', role: UserRole.USER, joinStatus: JoinStatus.APPROVED, isActive: true };

  it('Access Token을 정상적으로 생성해야 함', () => {
    const token = generateAccessToken(user);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.id).toBe(user.id);
    expect(decoded.role).toBe(user.role);
  });

  it('Access Token 검증이 정상 작동해야 함', () => {
    const token = generateAccessToken(user);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(user.id);
  });

  it('만료된 Access Token은 예외를 발생시켜야 함', () => {
    const expiredToken = jwt.sign(user, env.ACCESS_TOKEN_SECRET, { expiresIn: '-1s' });
    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });

  it('RefreshToken 생성 및 검증이 정상 작동해야 함', () => {
    const refresh = generateRefreshToken(user);
    const decoded = verifyRefreshToken(refresh);
    expect(decoded.id).toBe(user.id);
  });

  it('위조된 Refresh Token은 예외를 발생시켜야 함', () => {
    const fake = jwt.sign({ id: 'x' }, 'fake-secret');
    expect(() => verifyRefreshToken(fake)).toThrow();
  });

  it('Access Token 생성 중 예외 발생 시 ApiError를 던져야 함', () => {
    const spy = jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('sign failed');
    });
    expect(() => generateAccessToken(user)).toThrow(/Access Token 생성/);
    spy.mockRestore();
  });

  it('Refresh Token 생성 중 예외 발생 시 ApiError를 던져야 함', () => {
    const spy = jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('sign failed');
    });
    expect(() => generateRefreshToken(user)).toThrow(/Refresh Token 생성/);
    spy.mockRestore();
  });

  it('Access Token 검증 중 예외 발생 시 ApiError를 던져야 함', () => {
    const spy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('verify failed');
    });
    expect(() => verifyAccessToken('invalid')).toThrow(/Access Token.*검증/);
    spy.mockRestore();
  });

  it('Refresh Token 검증 중 예외 발생 시 ApiError를 던져야 함', () => {
    const spy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('verify failed');
    });
    expect(() => verifyRefreshToken('invalid')).toThrow(/Refresh Token.*검증/);
    spy.mockRestore();
  });
});
