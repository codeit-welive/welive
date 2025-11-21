import prisma from '#core/prisma';
import { CommentCreateDto } from './dto/comments.dto';
import { BoardType } from '@prisma/client';

// ==================== 게시글 접근 권한 확인 (CREATE용) ====================

/**
 * ADMIN의 민원 게시글 접근 권한 확인
 * @param userId - 관리자 ID
 * @param complaintId - 민원 게시글 ID
 * @returns boardId - 권한이 있으면 boardId 반환, 없으면 undefined
 * @description 관리자가 해당 아파트의 관리자인지 확인
 */
export const getAdminComplaintBoardId = async (userId: string, complaintId: string) => {
  const board = await prisma.complaint.findUnique({
    where: {
      id: complaintId,
      board: {
        apartment: {
          adminId: userId,
        },
      },
    },
    select: {
      boardId: true,
    },
  });
  return board?.boardId;
};

/**
 * USER의 민원 게시글 접근 권한 확인
 * @param userId - 사용자 ID
 * @param complaintId - 민원 게시글 ID
 * @returns boardId - 권한이 있으면 boardId 반환, 없으면 undefined
 * @description 사용자가 해당 아파트의 거주자인지 확인
 */
export const getUserComplaintBoardId = async (userId: string, complaintId: string) => {
  const board = await prisma.complaint.findUnique({
    where: {
      id: complaintId,
      board: {
        apartment: {
          residents: {
            some: {
              user: {
                id: userId,
              },
            },
          },
        },
      },
    },
    select: {
      boardId: true,
    },
  });
  return board?.boardId;
};

/**
 * ADMIN의 공지 게시글 접근 권한 확인
 * @param userId - 관리자 ID
 * @param noticeId - 공지 게시글 ID
 * @returns boardId - 권한이 있으면 boardId 반환, 없으면 undefined
 * @description 관리자가 해당 아파트의 관리자인지 확인
 */
export const getAdminNoticeBoardId = async (userId: string, noticeId: string) => {
  const board = await prisma.notice.findUnique({
    where: {
      id: noticeId,
      board: {
        apartment: {
          adminId: userId,
        },
      },
    },
    select: {
      boardId: true,
    },
  });
  return board?.boardId;
};

/**
 * USER의 공지 게시글 접근 권한 확인
 * @param userId - 사용자 ID
 * @param noticeId - 공지 게시글 ID
 * @returns boardId - 권한이 있으면 boardId 반환, 없으면 undefined
 * @description 사용자가 해당 아파트의 거주자인지 확인
 */
export const getUserNoticeBoardId = async (userId: string, noticeId: string) => {
  const board = await prisma.notice.findUnique({
    where: {
      id: noticeId,
      board: {
        apartment: {
          residents: {
            some: {
              user: {
                id: userId,
              },
            },
          },
        },
      },
    },
    select: {
      boardId: true,
    },
  });
  return board?.boardId;
};

// ==================== 댓글 CRUD ====================

/**
 * 댓글 생성
 * @param data - 댓글 생성 데이터 (content, userId, boardType, boardId)
 * @param boardId - 실제 board 테이블의 ID (권한 검증 후 전달됨)
 * @returns 생성된 댓글 정보 (user 정보 포함)
 * @description boardType에 따라 complaintId 또는 noticeId를 함께 저장
 */
export const createComment = async (data: CommentCreateDto, boardId: string) => {
  return await prisma.comment.create({
    data: {
      content: data.content,
      userId: data.userId,
      boardType: data.boardType,
      boardId,
      complaintId: data.boardType === BoardType.COMPLAINT ? data.boardId : undefined,
      noticeId: data.boardType === BoardType.NOTICE ? data.boardId : undefined,
    },
    select: {
      id: true,
      userId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
};

/**
 * 댓글 수정
 * @param commentId - 수정할 댓글 ID
 * @param content - 수정할 댓글 내용
 * @returns 수정된 댓글 정보 (user 정보 포함)
 * @description 댓글 내용(content)만 업데이트
 */
export const patchComment = async (commentId: string, content: string) => {
  return await prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
    },
    select: {
      id: true,
      userId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
};

/**
 * 댓글 삭제
 * @param commentId - 삭제할 댓글 ID
 * @description DB에서 댓글을 완전히 제거
 */
export const deleteComment = async (commentId: string) => {
  await prisma.comment.delete({
    where: { id: commentId },
  });
};

// ==================== 댓글 권한 확인 (UPDATE/DELETE용) ====================

/**
 * 댓글 작성자 ID 조회
 * @param commentId - 댓글 ID
 * @returns userId - 댓글 작성자 ID (댓글이 없으면 undefined)
 * @description 댓글 수정/삭제 권한 확인용
 */
export const getUserIdByCommentId = async (commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  return comment?.userId;
};

/**
 * 댓글이 속한 아파트의 관리자 ID 조회
 * @param commentId - 댓글 ID
 * @returns adminId - 아파트 관리자 ID (댓글/게시판/아파트가 없으면 undefined)
 * @description ADMIN의 댓글 삭제 권한 확인용 (관리 아파트의 모든 댓글 삭제 가능)
 */
export const getAdminIdByCommentId = async (commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      board: {
        select: {
          apartment: {
            select: {
              adminId: true,
            },
          },
        },
      },
    },
  });
  return comment?.board.apartment.adminId;
};
