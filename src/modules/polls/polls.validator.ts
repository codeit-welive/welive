import type { RequestHandler } from 'express';
import forwardZodError from '#utils/zod';
import { createPollBodySchema, patchPollBodySchema, pollListQueryInputSchema } from './dto/polls.dto';

export const validateCreatePollBody: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await createPollBodySchema.parseAsync({
      userId: req.user.id,
      ...req.body,
    });
    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '투표 생성', next);
  }
};

export const validatePollListQuery: RequestHandler = async (req, res, next) => {
  try {
    const validatedQuery = await pollListQueryInputSchema.parseAsync({
      ...req.query,
    });

    res.locals.query = validatedQuery;
    console.log('리스트 검사');
    next();
  } catch (err) {
    forwardZodError(err, '투표 목록 조회', next);
  }
};

export const validatePatchPollBody: RequestHandler = async (req, res, next) => {
  try {
    const validatedBody = await patchPollBodySchema.parseAsync({
      userId: req.user.id,
      ...req.body,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '투표 수정', next);
  }
};
