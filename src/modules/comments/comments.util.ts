import * as CommentRepo from './comments.repo';
import { CommentCreateDto, CommentWithUserDto } from './dto/comments.dto';
import { BoardType, UserRole } from '@prisma/client';

export const formatCommentResponse = (comment: CommentWithUserDto, data: CommentCreateDto) => {
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
