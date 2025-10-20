import type { RequestHandler } from 'express';
import { verifyAccessToken } from '#modules/auth/utils/tokenUtils';
import ApiError from '#errors/ApiError';

const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) throw new ApiError(401, '로그인이 필요합니다.');

  const decoded = verifyAccessToken(token);

  req.user = { id: decoded.id };

  next();
};

export default authMiddleware;
