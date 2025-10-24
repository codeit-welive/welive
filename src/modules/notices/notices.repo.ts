import prisma from '#core/prisma';
import { NoticeCreateDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { Prisma } from '@prisma/client';

const getBoardType = async (boardId: string) => {
  const boardType = await prisma.board.findUnique({
    where: { id: boardId },
    select: { type: true },
  });
  return boardType;
};

const existNotice = async (noticeId: string) => {
  const exists = await prisma.notice.count({
    where: {
      id: noticeId,
    },
  });
  return exists > 0;
};

const createNotice = async (data: NoticeCreateDTO) => {
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
    },
  });
  return notice;
};

const getNoticeList = async (where: Prisma.NoticeWhereInput, pageSize: number, skip: number) => {
  const [noticeList, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      skip,
      take: pageSize,
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

const getNotice = async (noticeId: string) => {
  const notice = await prisma.notice.findUnique({
    where: { id: noticeId },
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
      content: true,
      comments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  return notice;
};

const updateNotice = async (noticeId: string, data: NoticeUpdateDTO) => {
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

const deleteNotice = async (noticeId: string) => {
  await prisma.notice.delete({
    where: {
      id: noticeId,
    },
  });
};

export default {
  getBoardType,
  existNotice,
  createNotice,
  getNoticeList,
  getNotice,
  updateNotice,
  deleteNotice,
};
