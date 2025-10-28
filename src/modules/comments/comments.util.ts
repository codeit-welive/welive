import * as CommentRepo from './comments.repo';
import { CommentCreateDto, CommentPatchDto, CommentWithUserDto, CommentDeleteDto } from './dto/comments.dto';
import { BoardType, UserRole } from '@prisma/client';
import ApiError from '#errors/ApiError';
import { COMMENT_ERROR_MESSAGES } from '#constants/comment.constant';

/**
 * 댓글 응답 포맷팅
 * @param comment - DB에서 조회한 댓글 데이터 (user 정보 포함)
 * @param data - 요청 데이터 (boardType, boardId 사용)
 * @returns 포맷팅된 응답 객체 { comment: {...}, board: {...} }
 */
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

/**
 * 게시글 접근 권한 확인 함수 매핑
 * - boardType (COMPLAINT, NOTICE)과 role (ADMIN, USER)에 따라 적절한 Repository 함수 매핑
 * - ADMIN: 본인이 관리하는 아파트의 게시글만 접근 가능
 * - USER: 본인이 거주하는 아파트의 게시글만 접근 가능
 */
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

/**
 * 댓글 삭제 권한 확인 함수 매핑
 * - USER: 본인이 작성한 댓글만 삭제 가능 (댓글 작성자 ID 반환)
 * - ADMIN: 본인이 관리하는 아파트의 모든 댓글 삭제 가능 (아파트 관리자 ID 반환)
 */
export const COMMENT_DELETE_PERMISSION_CHECKERS = {
  [UserRole.USER]: CommentRepo.getUserIdByCommentId,
  [UserRole.ADMIN]: CommentRepo.getAdminIdByCommentId,
} as const;

/**
 * 댓글 생성 권한 검증
 * @param data - 댓글 생성 데이터 (userId, boardType, boardId, role)
 * @returns boardId - 실제 board 테이블의 ID
 * @throws ApiError.forbidden - 게시글이 존재하지 않거나 접근 권한이 없음
 * @description boardType과 role에 따라 적절한 Repository 함수를 호출하여 권한 확인
 */
export const validateCreatePermission = async (data: CommentCreateDto) => {
  const getBoardIdFn = BOARD_ID_GETTERS[data.boardType][data.role];
  const validBoardId = await getBoardIdFn(data.userId, data.boardId);

  if (!validBoardId) {
    throw ApiError.forbidden(COMMENT_ERROR_MESSAGES.CREATE_FORBIDDEN);
  }

  return validBoardId;
};

/**
 * 댓글 수정 권한 검증
 * @param data - 댓글 수정 데이터 (userId, commentId)
 * @throws ApiError.notFound - 댓글을 찾을 수 없음
 * @throws ApiError.forbidden - 댓글 수정 권한이 없음 (본인 댓글만 수정 가능)
 * @description role 구분 없이 댓글 작성자만 수정 가능
 */
export const validatePatchPermission = async (data: CommentPatchDto) => {
  const commentAuthorId = await CommentRepo.getUserIdByCommentId(data.commentId);

  if (!commentAuthorId) {
    throw ApiError.notFound(COMMENT_ERROR_MESSAGES.NOT_FOUND);
  }

  if (commentAuthorId !== data.userId) {
    throw ApiError.forbidden(COMMENT_ERROR_MESSAGES.PATCH_FORBIDDEN);
  }
};

/**
 * 댓글 삭제 권한 검증
 * @param data - 댓글 삭제 데이터 (userId, commentId, role)
 * @throws ApiError.notFound - 댓글을 찾을 수 없음
 * @throws ApiError.forbidden - 댓글 삭제 권한이 없음
 * @description role에 따라 다른 권한 체크 (USER: 본인만, ADMIN: 관리 아파트 모든 댓글)
 */
export const validateDeletePermission = async (data: CommentDeleteDto) => {
  const checkPermissionFn = COMMENT_DELETE_PERMISSION_CHECKERS[data.role];
  const authorizedUserId = await checkPermissionFn(data.commentId);

  if (!authorizedUserId) {
    throw ApiError.notFound(COMMENT_ERROR_MESSAGES.NOT_FOUND);
  }

  if (authorizedUserId !== data.userId) {
    throw ApiError.forbidden(COMMENT_ERROR_MESSAGES.DELETE_FORBIDDEN);
  }
};
