import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import ApiError from '#errors/ApiError';

const requireRole = (allowedRole: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, '로그인이 필요합니다');

    const userRole = req.user.role;
    if (!allowedRole.includes(userRole)) throw new ApiError(403, '접근 권한이 없습니다');

    return next();
  };
};

export default requireRole;
