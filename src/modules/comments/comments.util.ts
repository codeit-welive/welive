import * as CommentRepo from './comments.repo';
import { CommentCreateDto, CommentPatchDto, CommentWithUserDto } from './dto/comments.dto';
import { BoardType, UserRole } from '@prisma/client';
import ApiError from '#errors/ApiError';

export const formatCommentResponse = (comment: CommentWithUserDto, data: CommentCreateDto | CommentPatchDto) => {
  return {
    comment: {
      id: comment.id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      writerName: comment.user.name,
    },
    board: {
      id: data.boardId,
      boardType: data.boardType,
    },
  };
};

export const BOARD_ID_GETTERS = {
  [BoardType.COMPLAINT]: {
    [UserRole.ADMIN]: CommentRepo.getAdminComplaintBoardId,
    [UserRole.USER]: CommentRepo.getUserComplaintBoardId,
  },
  [BoardType.NOTICE]: {
    [UserRole.ADMIN]: CommentRepo.getAdminNoticeBoardId,
    [UserRole.USER]: CommentRepo.getUserNoticeBoardId,
  },
} as const;

export const COMMENT_PERMISSION_CHECKERS = {
  [UserRole.USER]: CommentRepo.getUserIdByCommentId,
  [UserRole.ADMIN]: CommentRepo.getAdminIdByCommentId,
} as const;

/**
 * 댓글 생성 권한 검증
 */
export const validateCreatePermission = async (data: CommentCreateDto) => {
  const getBoardIdFn = BOARD_ID_GETTERS[data.boardType][data.role];
  const validBoardId = await getBoardIdFn(data.userId, data.boardId);

  if (!validBoardId) {
    throw ApiError.forbidden('해당 게시글이 존재하지 않거나 댓글을 작성할 권한이 없습니다.');
  }

  return validBoardId;
};

/**
 * 댓글 수정 권한 검증
 */
export const validatePatchPermission = async (data: CommentPatchDto) => {
  const checkPermissionFn = COMMENT_PERMISSION_CHECKERS[data.role];
  const authorizedUserId = await checkPermissionFn(data.commentId);

  if (!authorizedUserId) {
    throw ApiError.notFound('댓글을 찾을 수 없습니다.');
  }

  if (authorizedUserId !== data.userId) {
    throw ApiError.forbidden('댓글 수정 권한이 없습니다.');
  }
};
