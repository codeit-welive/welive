import type { RequestHandler } from 'express';
import { updateUserService } from './users.service';
import { USER_MESSAGES as MSG } from '#constants/user.constants';
import ApiError from '#errors/ApiError';

export const updateUserController: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.user;

    const body = res.locals.validatedBody;
    const file = res.locals.file;

    const result = await updateUserService(id, { body, file });
    res.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ApiError) return next(err);

    return next(ApiError.internal(MSG.INTERNAL_SERVER_ERROR, err));
  }
};
