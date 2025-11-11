import { RequestHandler } from 'express';
import forwardZodError from '#core/utils/zod';
import {
  residentCreateRequestBodySchema,
  residentListRequestQuerySchema,
  residentPatchRequestBodySchema,
  residentRequestParamSchema,
} from './dto/resident.dto';

export const validateResidentListRequestQuery: RequestHandler = (req, res, next) => {
  try {
    const validatedQuery = residentListRequestQuerySchema.parse(req.query);
    res.locals.validatedQuery = validatedQuery;

    next();
  } catch (err) {
    forwardZodError(err, '입주민 목록 조회 쿼리', next);
  }
};

export const validateResidentRequestParam: RequestHandler = (req, res, next) => {
  try {
    const validatedParams = residentRequestParamSchema.parse(req.params);
    res.locals.validatedParams = validatedParams;
    next();
  } catch (err) {
    forwardZodError(err, '입주민 조회 요청 파라미터', next);
  }
};

export const validatePatchResidentRequestBody: RequestHandler = (req, res, next) => {
  try {
    const validatedBody = residentPatchRequestBodySchema.parse(req.body);
    res.locals.validatedBody = validatedBody;

    next();
  } catch (err) {
    forwardZodError(err, '입주민 수정 요청 바디', next);
  }
};

export const validateCreateResidentRequestBody: RequestHandler = (req, res, next) => {
  try {
    const validatedBody = residentCreateRequestBodySchema.parse(req.body);
    res.locals.validatedBody = validatedBody;

    next();
  } catch (err) {
    forwardZodError(err, '입주민 생성 요청 바디', next);
  }
};
