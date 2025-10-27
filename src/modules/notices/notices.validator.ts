import type { RequestHandler } from 'express';
import forwardZodError from '#utils/zod';
import { noticeCreateSchema, noticeListQuerySchema, noticeParamsSchema, noticeUpdateSchema } from './dto/notices.dto';

export const validateNoticeParams: RequestHandler = async (req, res, next) => {
  try {
    const { noticeId } = req.params;
    await noticeParamsSchema.parseAsync(noticeId);
    next();
  } catch (err) {
    forwardZodError(err, '공지 상세 조회', next);
  }
};

export const validateNoticeQuery: RequestHandler = async (req, res, next) => {
  try {
    const validatedQuery = await noticeListQuerySchema.parseAsync({
      ...req.query,
    });

    res.locals.query = validatedQuery;
    next();
  } catch (err) {
    forwardZodError(err, '공지 목록 조회', next);
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
