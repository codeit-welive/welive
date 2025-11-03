import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import ApiError from '#errors/ApiError';

const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, '로그인이 필요합니다'));

    const userRole = req.user.role;
    const isActive = req.user.isActive;
    const joinStatus = req.user.joinStatus;

    console.log('User Role:', userRole, 'Is Active:', isActive, 'Join Status:', joinStatus);
    if (!allowedRoles.includes(userRole)) return next(new ApiError(403, '접근 권한이 없습니다'));
    if (!isActive) return next(new ApiError(403, '비활성화된 계정입니다'));
    if (joinStatus !== 'APPROVED') return next(new ApiError(403, '가입 상태가 활성화되어 있지 않습니다'));

    return next();
  };
};

export default requireRole;
