import jwt from 'jsonwebtoken';
import env from '#core/env';
import type { DecodedToken, AuthHeaderDto } from '#modules/auth/dto/token.dto';
import ApiError from '#errors/ApiError';
import { UserRole } from '@prisma/client';

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = env;

export const extractToken = (authHeader: AuthHeaderDto): string => {
  if (!authHeader.authorization.startsWith('Bearer ')) throw ApiError.unauthorized('토큰 형식이 올바르지 않습니다.');
  return authHeader.authorization.slice(7);
};

export const generateAccessToken = (user: { id: string; role: UserRole }): string => {
  try {
    return jwt.sign({ id: user.id, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  } catch (_err) {
    throw new ApiError(500, '❌ Access Token 생성에 실패했습니다.');
  }
};

export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;
  } catch {
    throw new ApiError(401, '❌ Access Token이 유효하지 않습니다.');
  }
};

export const generateRefreshToken = (user: { id: string }): string => {
  try {
    return jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '14d' });
  } catch (_err) {
    throw new ApiError(500, '❌ Refresh Token 생성에 실패했습니다.');
  }
};

export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
  } catch {
    throw new ApiError(403, '❌ Refresh Token이 유효하지 않습니다.');
  }
};
