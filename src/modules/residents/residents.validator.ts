import { RequestHandler } from 'express';
import forwardZodError from '#core/utils/zod';
import {
  residentCreateRequestBodySchema,
  residentListRequestQuerySchema,
  residentPatchRequestBodySchema,
  residentRequestParamSchema,
} from './dto/resident.dto';
import { CSV_HEADERS } from '#constants/csv.constant';
import ApiError from '#errors/ApiError';
import { extractHeaderFromBuffer } from './utils/csvUtil';

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

export const validateCsvHeader: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) return next(new ApiError(400, '파일이 첨부되지 않았습니다.'));
    // 간단 확장자 검사
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return next(new ApiError(400, 'CSV 파일만 업로드할 수 있습니다.'));
    }

    // 헤더 검사
    const headers = await extractHeaderFromBuffer(req.file.buffer);
    if (headers.length !== CSV_HEADERS.length) {
      return next(new ApiError(400, '잘못된 형식의 CSV 파일입니다'));
    }

    // 헤더 목록에 없는 항목이 있는지 검사
    const missingHeaders = CSV_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return next(new ApiError(400, '잘못된 형식의 CSV 파일입니다'));
    }
    next();
  } catch (err) {
    next(err);
  }
};
