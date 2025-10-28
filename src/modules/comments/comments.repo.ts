import prisma from '#core/prisma';
import { CommentCreateDto } from './dto/comments.dto';
import { BoardType } from '@prisma/client';

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

export const create = async (data: CommentCreateDto, boardId: string) => {
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

export const getUserIdByCommentId = async (commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  return comment?.userId;
};

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
