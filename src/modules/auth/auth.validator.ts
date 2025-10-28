import { RequestHandler } from 'express';
import forwardZodError from '#core/utils/zod';
import {
  signupSuperAdminRequestDtoSchema,
  signupAdminRequestDtoSchema,
  signupUserRequestDtoSchema,
} from './dto/register.dto';
import { isValidateApartmentRange } from './utils/isValidateApartmentRange';
import ApiError from '#errors/ApiError';

export const validateSuperAdminCreate: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await signupSuperAdminRequestDtoSchema.parseAsync(req.body);
    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '슈퍼 유저 생성', next);
  }
};

export const validateAdminCreate: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await signupAdminRequestDtoSchema.parseAsync(req.body);
    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '관리자 유저 생성', next);
  }
};

export const validateUserCreate: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await signupUserRequestDtoSchema.parseAsync(req.body);
    const isValidateApart = await isValidateApartmentRange(
      validatedBody.apartmentName,
      validatedBody.apartmentDong,
      validatedBody.apartmentHo
    );

    if (isValidateApart.valid === false) {
      return next(new ApiError(404, `아파트 동/호수 범위 오류: ${isValidateApart.message}`, 'BAD_REQUEST'));
    }
    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '일반 유저 생성', next);
  }
};
