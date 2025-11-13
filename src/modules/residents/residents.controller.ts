import { RequestHandler } from 'express';
import { createResident, getResident, getResidentList, patchResident, removeResident } from './residents.service';
import { Prisma } from '@prisma/client';
import ApiError from '#errors/ApiError';
import { mapUniqueConstraintError } from '#helpers/mapPrismaError';

export const getResidentListHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;
    const adminId = req.user.id;
    const result = await getResidentList(query, adminId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const result = await getResident(residentId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const patchResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const data = res.locals.validatedBody;
    const result = await patchResident(residentId, data);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    await removeResident(residentId);

    res.status(200).send({ message: '작업이 성공적으로 완료되었습니다' });
  } catch (err) {
    next(err);
  }
};

export const createResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;
    const adminId = req.user.id;
    const result = await createResident(data, adminId);

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorFields = err.meta?.target as string[];
        next(new ApiError(409, mapUniqueConstraintError(errorFields).message));
      }
    }
    next(err);
  }
};
