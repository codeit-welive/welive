import type { Request, Response, NextFunction } from 'express';
import { CommentCreateDto, CommentPatchDto } from './dto/comments.dto';
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

export const patchCommentHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as CommentPatchDto;

    const comment = await CommentService.patchComment(data);
    res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
};
