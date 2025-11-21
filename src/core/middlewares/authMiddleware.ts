import type { RequestHandler } from 'express';
import { verifyAccessToken } from '#modules/auth/utils/tokenUtils';
import ApiError from '#errors/ApiError';

const authMiddleware: RequestHandler = (req, _res, next) => {
  try {
    const cookies = req.cookies as Record<string, string>;
    const token = cookies['access_token'];
    if (!token) return next(new ApiError(401, '로그인이 필요합니다.'));

    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      joinStatus: decoded.joinStatus,
      isActive: decoded.isActive,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default authMiddleware;
