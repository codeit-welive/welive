import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import env from '#core/env';
import type { DecodedToken, AuthHeaderDto } from '#modules/auth/dto/token.dto';
import ApiError from '#errors/ApiError';
import { UserRole } from '@prisma/client';

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 */
export const extractToken = (authHeader: AuthHeaderDto): string => {
  if (!authHeader?.authorization?.startsWith('Bearer ')) throw ApiError.unauthorized('토큰 형식이 올바르지 않습니다.');
  return authHeader.authorization.slice(7);
};

/**
 * Access Token 생성
 */
export const generateAccessToken = (user: { id: string; role: UserRole }): string => {
  try {
    return jwt.sign({ id: user.id, role: user.role }, env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  } catch (err) {
    throw new ApiError(500, '❌ Access Token 생성에 실패했습니다.', 'INTERNAL_ERROR', err);
  }
};

/**
 * Access Token 검증
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as DecodedToken;
  } catch (err) {
    if (err instanceof TokenExpiredError)
      throw new ApiError(401, '❌ Access Token이 만료되었습니다.', 'UNAUTHORIZED', err);
    if (err instanceof JsonWebTokenError)
      throw new ApiError(401, '❌ Access Token이 유효하지 않습니다.', 'UNAUTHORIZED', err);
    throw new ApiError(500, '❌ Access Token 검증 중 오류가 발생했습니다.', 'INTERNAL_ERROR', err);
  }
};

/**
 * Refresh Token 생성
 */
export const generateRefreshToken = (user: { id: string }): string => {
  try {
    return jwt.sign({ id: user.id }, env.REFRESH_TOKEN_SECRET, { expiresIn: '14d' });
  } catch (err) {
    throw new ApiError(500, '❌ Refresh Token 생성에 실패했습니다.', 'INTERNAL_ERROR', err);
  }
};

/**
 * Refresh Token 검증
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as DecodedToken;
  } catch (err) {
    if (err instanceof TokenExpiredError)
      throw new ApiError(403, '❌ Refresh Token이 만료되었습니다.', 'FORBIDDEN', err);
    if (err instanceof JsonWebTokenError)
      throw new ApiError(403, '❌ Refresh Token이 유효하지 않습니다.', 'FORBIDDEN', err);
    throw new ApiError(500, '❌ Refresh Token 검증 중 오류가 발생했습니다.', 'INTERNAL_ERROR', err);
  }
};
