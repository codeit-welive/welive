import type { RequestHandler } from 'express';
import forwardZodError from '#core/utils/zod';
import { updateUserSchema } from './dto/updateUser.dto';

export const validateUserUpdate: RequestHandler = async (req, res, next) => {
  try {
    // 파일 버퍼 전달
    res.locals.file = req.file ? { buffer: req.file.buffer } : undefined;

    // body 검증 후 저장
    const validatedBody = await updateUserSchema.parseAsync(req.body);
    res.locals.validatedBody = validatedBody;

    next();
  } catch (err) {
    forwardZodError(err, '유저 정보 수정', next);
  }
};
