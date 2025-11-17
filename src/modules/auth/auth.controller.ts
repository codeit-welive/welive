import { RequestHandler } from 'express';
import {
  registSuperAdmin,
  registAdmin,
  registUser,
  login,
  patchAdminStatus,
  patchUserStatus,
  patchUserListStatus,
  cleanupRejectedUsers,
} from './auth.service';
import ApiError from '#errors/ApiError';
import { Prisma } from '@prisma/client';
import { mapUniqueConstraintError } from '#helpers/mapPrismaError';
import env from '#core/env';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './utils/tokenUtils';

export const registSuperAdminHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registSuperAdmin(data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      return next(new ApiError(409, mapUniqueConstraintError(errorFields).message));
    }
    return next(err);
  }
};

export const registerAdminHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registAdmin(data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      return next(new ApiError(409, mapUniqueConstraintError(errorFields).message));
    }
    return next(err);
  }
};

export const registerUserHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registUser(data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorFields = err.meta?.target as string[];
        return next(new ApiError(409, mapUniqueConstraintError(errorFields).message));
      } else if (err.code === 'P2025') {
        return next(new ApiError(404, '해당 아파트가 존재하지 않습니다.'));
      }
    }
    return next(err);
  }
};

export const loginHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;
    const result = await login(data);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });

    return res.status(200).json(result.user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return next(new ApiError(404, '사용자를 찾을 수 없습니다'));
      }
    }
    return next(err);
  }
};

export const logoutHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export const refreshTokenHandler: RequestHandler = async (req, res, next) => {
  try {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies['refresh_token'];

    const decoded = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
      joinStatus: decoded.joinStatus,
      isActive: decoded.isActive,
    });
    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      role: decoded.role,
      joinStatus: decoded.joinStatus,
      isActive: decoded.isActive,
    });

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });

    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    next(err);
  }
};

export const patchAdminStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;
    const data = res.locals.validatedBody;

    await patchAdminStatus(adminId, data.status);
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    next(err);
  }
};

export const patchUserStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = req.params.residentId;
    const adminId = req.user.id;
    const data = res.locals.validatedBody;

    if (!residentId) {
      await patchUserListStatus(data.status, adminId);
    } else {
      await patchUserStatus(residentId, data.status, adminId);
    }
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    next(err);
  }
};

export const cleanupHandler: RequestHandler = async (req, res, next) => {
  try {
    const role = req.user.role;

    await cleanupRejectedUsers(role);
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  } catch (err) {
    next(err);
  }
};
