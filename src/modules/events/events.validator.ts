import { RequestHandler } from 'express';
import { eventDeleteParamsInputSchema, eventListQueryInputSchema, eventUpdateQueryInputSchema } from './dto/events.dto';
import forwardZodError from '#core/utils/zod';

export const validateEventListQuery: RequestHandler = async (req, res, next) => {
  try {
    const validatedQuery = await eventListQueryInputSchema.parseAsync({
      ...req.query,
    });

    res.locals.query = validatedQuery;
    next();
  } catch (err) {
    forwardZodError(err, '이벤트 목록 조회', next);
  }
};

export const validateEventUpdateQuery: RequestHandler = async (req, res, next) => {
  try {
    const validatedQuery = await eventUpdateQueryInputSchema.parseAsync({
      ...req.query,
    });

    res.locals.query = validatedQuery;
    next();
  } catch (err) {
    forwardZodError(err, '이벤트 추가 및 업데이트', next);
  }
};

export const validateEventDeleteParams: RequestHandler = async (req, res, next) => {
  try {
    const validatedParams = await eventDeleteParamsInputSchema.parseAsync({
      ...req.query,
    });

    res.locals.params = validatedParams;
    next();
  } catch (err) {
    forwardZodError(err, '이벤트 삭제', next);
  }
};
