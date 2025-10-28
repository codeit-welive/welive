import type { Request, Response, NextFunction } from 'express';
import forwardZodError from '#utils/zod';
import { commentCreateSchema, commentPatchSchema, commentDeleteSchema } from './dto/comments.dto';

/**
 * 댓글 생성 요청 검증
 * req.user와 req.body를 결합하여 Zod 스키마로 검증 후 res.locals.validatedBody에 저장
 */
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

/**
 * 댓글 수정 요청 검증
 * req.params.commentId, req.user, req.body를 결합하여 Zod 스키마로 검증
 */
export const validateCommentPatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const validatedBody = await commentPatchSchema.parseAsync({
      userId: req.user.id,
      role: req.user.role,
      ...req.body,
      commentId,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '댓글 수정', next);
  }
};

/**
 * 댓글 삭제 요청 검증
 * req.params.commentId와 req.user를 결합하여 Zod 스키마로 검증
 */
export const validateCommentDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const validatedBody = await commentDeleteSchema.parseAsync({
      userId: req.user.id,
      role: req.user.role,
      commentId,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '댓글 삭제', next);
  }
};
