import { RequestHandler } from 'express';
import forwardZodError from '#core/utils/zod';
import { apartmentRequestParamsSchema, apartmentRequestQuerySchema } from './dto/apartment.dto';

export const validateApartmentRequestQuery: RequestHandler = (req, res, next) => {
  try {
    const validatedQuery = apartmentRequestQuerySchema.parse(req.query);
    res.locals.validatedQuery = validatedQuery;
    next();
  } catch (err) {
    forwardZodError(err, '아파트 조회 쿼리 파라미터 검증', next);
  }
};

export const validateApartmentRequestParams: RequestHandler = (req, res, next) => {
  try {
    const validatedParams = apartmentRequestParamsSchema.parse(req.params);
    res.locals.validatedParams = validatedParams;

    next();
  } catch (err) {
    forwardZodError(err, '아파트 조회 URL 파라미터 검증', next);
  }
};
