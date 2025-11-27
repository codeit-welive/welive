import prisma from '#core/prisma';
import { NoticeCreateDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { BoardType, Prisma } from '@prisma/client';

export const getBoardIdByUserId = async (userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.NOTICE,
      apartment: {
        residents: {
          some: {
            user: {
              id: userId,
            },
            isRegistered: true,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });
  return board;
};

export const getBoardIdByAdminId = async (adminId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.NOTICE,
      apartment: {
        adminId,
      },
    },
    select: {
      id: true,
    },
  });
  return board;
};

export const getBoardTypeRepo = async (boardId: string) => {
  // Notice에서 검색
  const notice = await prisma.notice.findUnique({
    where: { id: boardId },
    select: {
      board: {
        select: { type: true },
      },
    },
  });

  if (notice && notice.board) {
    return { type: notice.board.type as BoardType };
  }

  // 없으면 Poll에서 검색
  const poll = await prisma.poll.findUnique({
    where: { id: boardId },
    select: {
      board: {
        select: { type: true },
      },
    },
  });

  if (poll && poll.board) {
    return { type: poll.board.type as BoardType };
  }

  // 둘 다 없다면 null → 404
  return null;
};

export const getApartmentIdByAdminId = async (adminId: string) => {
  return await prisma.apartment.findUnique({
    where: {
      adminId,
    },
    select: {
      id: true,
      apartmentName: true,
    },
  });
};

export const existNoticeRepo = async (noticeId: string) => {
  const exists = await prisma.notice.count({
    where: {
      id: noticeId,
    },
  });
  return exists > 0;
};

export const createNoticeRepo = async (data: NoticeCreateDTO, apartmentId: string) => {
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      user: { connect: { id: data.userId } },
      board: { connect: { id: data.boardId } },
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      isPinned: data.isPinned ?? false,
      apartment: {
        connect: {
          id: apartmentId,
        },
      },
    },
  });
  return notice;
};

export const getNoticeListRepo = async (where: Prisma.NoticeWhereInput, pageSize: number, skip: number) => {
  const [noticeList, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        viewsCount: true,
        _count: {
          select: {
            comments: true,
          },
        },
        isPinned: true,
      },
    }),
    prisma.notice.count({
      where,
    }),
  ]);
  return { data: noticeList, total };
};

export const getNoticeRepo = async (noticeId: string) => {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
    select: {
      id: true,
      user: { select: { id: true, name: true } },
      category: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      viewsCount: true,
      _count: { select: { comments: true } },
      isPinned: true,
      content: true,
      board: { select: { type: true } },
      comments: {
        select: {
          id: true,
          user: { select: { id: true, name: true } },
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  return notice;
};

export const updateNoticeRepo = async (noticeId: string, data: NoticeUpdateDTO) => {
  const notice = await prisma.notice.update({
    where: {
      id: noticeId,
    },
    data: {
      category: data.category,
      title: data.title,
      content: data.content,
      boardId: data.boardId,
      isPinned: data.isPinned,
      startDate: data.startDate,
      endDate: data.endDate,
    },
    select: {
      id: true,
      category: true,
      title: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      viewsCount: true,
      _count: {
        select: {
          comments: true,
        },
      },
      isPinned: true,
    },
  });
  return notice;
};

export const deleteNoticeRepo = async (noticeId: string) => {
  await prisma.notice.delete({
    where: {
      id: noticeId,
    },
  });
};
