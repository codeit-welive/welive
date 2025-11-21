import type { Request, Response, NextFunction } from 'express';
import { CommentCreateDto, CommentPatchDto, CommentDeleteDto } from './dto/comments.dto';
import * as CommentService from './comments.service';
import { RESPONSE_MESSAGES } from '#constants/response.constant';

/**
 * 댓글 생성 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 댓글 생성
 * @returns 201 Created - 생성된 댓글 정보 (comment, board)
 * @throws ApiError - 권한 없음, 게시글 없음 등
 */
export const createCommentHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as CommentCreateDto;

    const comment = await CommentService.createComment(data);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

/**
 * 댓글 수정 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 댓글 수정
 * @returns 200 OK - 수정된 댓글 정보 (comment, board)
 * @throws ApiError - 댓글 없음, 수정 권한 없음 (본인 댓글만 수정 가능)
 */
export const patchCommentHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as CommentPatchDto;

    const comment = await CommentService.patchComment(data);
    res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
};

/**
 * 댓글 삭제 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 댓글 삭제
 * @returns 200 OK - 삭제 성공 메시지
 * @throws ApiError - 댓글 없음, 삭제 권한 없음
 *   - USER: 본인 댓글만 삭제 가능
 *   - ADMIN: 본인 댓글 또는 관리 아파트의 모든 댓글 삭제 가능
 */
export const deleteCommentHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as CommentDeleteDto;

    await CommentService.deleteComment(data);
    res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    next(err);
  }
};
