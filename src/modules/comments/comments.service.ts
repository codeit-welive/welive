import * as CommentRepo from './comments.repo';
import { CommentCreateDto, CommentPatchDto, CommentDeleteDto } from './dto/comments.dto';
import {
  formatCommentResponse,
  validateCreatePermission,
  validatePatchPermission,
  validateDeletePermission,
} from './comments.util';

/**
 * 댓글 생성 비즈니스 로직
 * @param data - 댓글 생성 데이터 (userId, content, boardType, boardId, role)
 * @returns 생성된 댓글 정보와 게시글 정보
 * @throws ApiError.forbidden - 게시글 접근 권한 없음
 *
 * 처리 흐름:
 * 1. 권한 검증 (role에 따라 게시글 접근 권한 확인)
 * 2. 댓글 생성 (DB 저장)
 * 3. 응답 포맷팅
 */
export const createComment = async (data: CommentCreateDto) => {
  // 1. 권한 검증
  const boardId = await validateCreatePermission(data);

  // 2. 댓글 생성
  const comment = await CommentRepo.createComment(data, boardId);

  // 3. 응답 포맷팅
  return formatCommentResponse(comment, data);
};

/**
 * 댓글 수정 비즈니스 로직
 * @param data - 댓글 수정 데이터 (userId, content, boardType, boardId, role, commentId)
 * @returns 수정된 댓글 정보와 게시글 정보
 * @throws ApiError.notFound - 댓글을 찾을 수 없음
 * @throws ApiError.forbidden - 댓글 수정 권한 없음 (본인 댓글만 수정 가능)
 *
 * 처리 흐름:
 * 1. 권한 검증 (댓글 작성자 확인, role 무관)
 * 2. 댓글 수정 (content 업데이트)
 * 3. 응답 포맷팅
 */
export const patchComment = async (data: CommentPatchDto) => {
  // 1. 권한 검증
  await validatePatchPermission(data);

  // 2. 댓글 수정
  const updatedComment = await CommentRepo.patchComment(data.commentId, data.content);

  // 3. 응답 포맷팅
  return formatCommentResponse(updatedComment, data);
};

/**
 * 댓글 삭제 비즈니스 로직
 * @param data - 댓글 삭제 데이터 (userId, role, commentId)
 * @throws ApiError.notFound - 댓글을 찾을 수 없음
 * @throws ApiError.forbidden - 댓글 삭제 권한 없음
 *   - USER: 본인이 작성한 댓글만 삭제 가능
 *   - ADMIN: 본인이 작성한 댓글 또는 관리하는 아파트의 모든 댓글 삭제 가능
 *
 * 처리 흐름:
 * 1. 권한 검증 (role에 따라 다른 권한 체크)
 * 2. 댓글 삭제 (DB에서 제거)
 */
export const deleteComment = async (data: CommentDeleteDto) => {
  // 1. 권한 검증
  await validateDeletePermission(data);
  // 2. 댓글 삭제
  await CommentRepo.deleteComment(data.commentId);
};
