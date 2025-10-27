import ApiError from '#errors/ApiError';
import * as CommentRepo from './comments.repo';
import { CommentCreateDto } from './dto/comments.dto';
import { formatCommentResponse, BOARD_ID_GETTERS } from './comments.util';

export const createComment = async (data: CommentCreateDto) => {
  // 1. 적절한 권한 검증 함수 선택
  const getBoardIdFn = BOARD_ID_GETTERS[data.boardType][data.role];

  // 2. 권한 체크
  const boardId = await getBoardIdFn(data.userId, data.boardId);

  if (!boardId) {
    throw ApiError.forbidden('해당 게시글에 댓글을 작성할 권한이 없습니다.');
  }

  // 3. 댓글 생성
  const comment = await CommentRepo.create(data, boardId);

  // 4. 응답 포맷팅
  return formatCommentResponse(comment, data);
};
