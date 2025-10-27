import type { Request, Response, NextFunction } from 'express';
import { CommentCreateDto } from './dto/comments.dto';
import * as CommentService from './comments.service';

export const createCommentHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as CommentCreateDto;

    const comment = await CommentService.createComment(data);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};
