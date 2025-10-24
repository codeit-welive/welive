import type { RequestHandler } from 'express';
import forwardZodError from '#utils/zod';
import { noticeCreateSchema, noticeQuerySchema, noticeUpdateSchema } from './dto/notices.dto';

export const validateNoticeQuery: RequestHandler = async (req, res, next) => {
  try {
    const validatedParams = await noticeQuerySchema.parseAsync({
      ...req.query,
    });

    res.locals.query = validatedParams;
    next();
  } catch (err) {
    forwardZodError(err, '쿼리 오류', next);
  }
};

export const validateNoticeCreate: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await noticeCreateSchema.parseAsync({
      userId: req.user.id,
      ...req.body,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '공지 등록', next);
  }
};

export const validateNoticeUpdate: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await noticeUpdateSchema.parseAsync({
      userId: req.user.id,
      ...req.body,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '공지 수정', next);
  }
};
