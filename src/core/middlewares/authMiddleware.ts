import type { RequestHandler } from 'express';
import { verifyAccessToken } from '#modules/auth/utils/tokenUtils';
import ApiError from '#errors/ApiError';
import { User, UserRole } from '@prisma/client';

const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.cookies['access_token'];

  if (!token) throw new ApiError(401, '로그인이 필요합니다.');

  const decoded = verifyAccessToken(token) as { id: string, role: UserRole };

  req.user = { 
    id: decoded.id,
    role: decoded.role 
  };

  next();
};

export default authMiddleware;
