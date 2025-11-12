import prisma from '#core/prisma';
import { BoardType, EventCategory } from '@prisma/client';

export const getEventListRepo = async (where: object) => {
  return prisma.event.findMany({
    where,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      title: true,
      category: true,
      boardType: true,
    },
  });
};

export const getNoticeDataByBoardId = async (boardId: string) => {
  const data = await prisma.notice.findUnique({
    where: {
      id: boardId,
    },
    select: {
      title: true,
      startDate: true,
      endDate: true,
      category: true,
      apartmentId: true,
    },
  });
  return data;
};

export const getPollDataByBoardId = async (boardId: string) => {
  const data = await prisma.poll.findUnique({
    where: {
      id: boardId,
    },
    select: {
      title: true,
      startDate: true,
      endDate: true,
      apartmentId: true,
    },
  });
  return data;
};

export const upsertEventByNoticeId = async (
  boardId: string,
  boardType: BoardType,
  category: EventCategory,
  title: string,
  apartmentId: string,
  startDate: Date,
  endDate: Date
) => {
  await prisma.event.upsert({
    where: {
      noticeId: boardId,
    },
    update: {
      title,
      category,
      boardType,
      startDate,
      endDate,
      notice: {
        connect: {
          id: boardId,
        },
      },
      apartment: {
        connect: {
          id: apartmentId,
        },
      },
    },
    create: {
      title,
      category,
      boardType,
      startDate,
      endDate,
      notice: {
        connect: {
          id: boardId,
        },
      },
      apartment: {
        connect: {
          id: apartmentId,
        },
      },
    },
  });
};

export const upsertEventByPollId = async (
  boardId: string,
  boardType: BoardType,
  category: EventCategory,
  title: string,
  apartmentId: string,
  startDate: Date,
  endDate: Date
) => {
  await prisma.event.upsert({
    where: {
      noticeId: boardId,
    },
    update: {
      title,
      category,
      boardType,
      startDate,
      endDate,
      poll: {
        connect: {
          id: boardId,
        },
      },
      apartment: {
        connect: {
          id: apartmentId,
        },
      },
    },
    create: {
      title,
      category,
      boardType,
      startDate,
      endDate,
      poll: {
        connect: {
          id: boardId,
        },
      },
      apartment: {
        connect: {
          id: apartmentId,
        },
      },
    },
  });
};

export const deleteEventRepo = async (eventId: string) => {
  return await prisma.event.delete({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      boardType: true,
      noticeId: true,
      pollId: true,
    },
  });
};
