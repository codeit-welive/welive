import type { Request, Response, NextFunction } from 'express';
import forwardZodError from '#utils/zod';
import { commentCreateSchema } from './dto/comments.dto';

export const validateCommentCreate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedBody = await commentCreateSchema.parseAsync({
      userId: req.user.id,
      role: req.user.role,
      ...req.body,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '댓글 생성', next);
  }
};
