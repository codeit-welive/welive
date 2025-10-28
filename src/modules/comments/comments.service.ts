import * as CommentRepo from './comments.repo';
import { CommentCreateDto, CommentPatchDto } from './dto/comments.dto';
import { formatCommentResponse, validateCreatePermission, validatePatchPermission } from './comments.util';

export const createComment = async (data: CommentCreateDto) => {
  // 1. 권한 검증
  const boardId = await validateCreatePermission(data);

  // 2. 댓글 생성
  const comment = await CommentRepo.create(data, boardId);

  // 3. 응답 포맷팅
  return formatCommentResponse(comment, data);
};

export const patchComment = async (data: CommentPatchDto) => {
  // 1. 권한 검증
  await validatePatchPermission(data);

  // 2. 댓글 수정
  const updatedComment = await CommentRepo.patchComment(data.commentId, data.content);

  // 3. 응답 포맷팅
  return formatCommentResponse(updatedComment, data);
};
