import { RequestHandler } from 'express';
import { deleteVoteParamsSchema, postVoteParamsSchema } from './dto/options.dto';
import forwardZodError from '#core/utils/zod';

export const validatePostVoteParams: RequestHandler = async (req, res, next) => {
  try {
    const validatedParams = await postVoteParamsSchema.parseAsync({
      ...req.params,
    });

    res.locals.validatedParams = validatedParams;
    next();
  } catch (err) {
    forwardZodError(err, '투표하기', next);
  }
};

export const validateDeleteVoteParams: RequestHandler = async (req, res, next) => {
  try {
    const validatedParams = await deleteVoteParamsSchema.parseAsync({
      ...req.params,
    });

    res.locals.validatedParams = validatedParams;
    next();
  } catch (err) {
    forwardZodError(err, '투표 취소', next);
  }
};
