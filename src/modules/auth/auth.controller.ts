import { RequestHandler } from 'express';
import { registSuperAdmin, registAdmin, registUser } from './auth.service';
import ApiError from '#errors/ApiError';
import { Prisma } from '@prisma/client';
import { checkDuplicateData } from './utils/checkDuplicateData';

export const registSuperAdminHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registSuperAdmin(data);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      throw ApiError.conflict(checkDuplicateData(errorFields).message);
    }
    next(err);
  }
};

export const registerAdminHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registAdmin(data);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      throw ApiError.conflict(checkDuplicateData(errorFields).message);
    }
    next(err);
  }
};

export const registerUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registUser(data);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorFields = err.meta?.target as string[];
        throw ApiError.conflict(checkDuplicateData(errorFields).message);
      } else if (err.code === 'P2025') {
        throw ApiError.notFound('해당 아파트가 존재하지 않습니다.');
      }
    }
    next(err);
  }
};
