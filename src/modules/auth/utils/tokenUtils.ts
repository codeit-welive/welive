import jwt from 'jsonwebtoken';
import env from '#core/env';
import type { DecodedToken, AuthHeaderDto } from '#modules/auth/dto/token.dto';
import ApiError from '#errors/ApiError';
import { UserRole } from '@prisma/client';

const ACCESS_SECRET = env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = env.REFRESH_TOKEN_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) throw new Error('❌ Invalid ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET');

export const extractToken = (authHeader: AuthHeaderDto): string => {
  if (!authHeader.authorization.startsWith('Bearer ')) throw ApiError.unauthorized('토큰 형식이 올바르지 않습니다.');
  return authHeader.authorization.slice(7);
};

export const generateAccessToken = (user: { id: string, role: UserRole }): string => {
  try {
    return jwt.sign({ id: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: '1h' });
  } catch (err) {
    throw new ApiError(500, '❌ Access Token 생성에 실패했습니다.');
  }
};

export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as DecodedToken;
  } catch {
    throw new ApiError(401, '❌ Access Token이 유효하지 않습니다.');
  }
};

export const generateRefreshToken = (user: { id: string }): string => {
  try {
    return jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '14d' });
  } catch (err) {
    throw new ApiError(500, '❌ Refresh Token 생성에 실패했습니다.');
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as DecodedToken;
  } catch {
    throw new ApiError(403, '❌ Refresh Token이 유효하지 않습니다.');
  }
};
