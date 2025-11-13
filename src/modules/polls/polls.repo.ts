import prisma from '#core/prisma';
import { BoardType, Prisma } from '@prisma/client';
import { createPollBodyDTO, patchPollBodyDTO } from './dto/polls.dto';

export const getBoardIdByUserId = async (userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.POLL,
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
      type: BoardType.POLL,
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

export const getPollStatusRepo = async (pollId: string) => {
  return await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      status: true,
    },
  });
};

export const createPollRepo = async (data: createPollBodyDTO, apartmentId: string) => {
  return prisma.poll.create({
    data: {
      boardId: data.boardId,
      userId: data.userId,
      title: data.title,
      content: data.content,
      buildingPermission: data.buildingPermission,
      startDate: data.startDate,
      endDate: data.endDate,
      options: {
        create: data.options.map((opt) => ({
          title: opt.title,
        })),
      },
      apartmentId,
    },
  });
};

export const getPollListRepo = async (where: Prisma.PollWhereInput, pageSize: number, skip: number) => {
  const [pollList, total] = await Promise.all([
    prisma.poll.findMany({
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
        title: true,
        buildingPermission: true,
        createdAt: true,
        updatedAt: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    }),
    prisma.poll.count({
      where,
    }),
  ]);
  return { data: pollList, total };
};

export const getPollRepo = async (pollId: string) => {
  const poll = await prisma.poll.findUnique({
    where: {
      id: pollId,
    },
    select: {
      id: true,
      title: true,
      user: {
        select: { id: true, name: true },
      },
      buildingPermission: true,
      createdAt: true,
      updatedAt: true,
      startDate: true,
      endDate: true,
      status: true,
      content: true,
      board: {
        select: { type: true },
      },
      options: {
        select: {
          id: true,
          title: true,
          //voteCount: true,
        },
      },
    },
  });
  return poll;
};

export const patchPollRepo = async (pollId: string, data: patchPollBodyDTO) => {
  await prisma.poll.update({
    where: {
      id: pollId,
    },
    data: {
      title: data.title,
      content: data.content,
      buildingPermission: data.buildingPermission,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      options: {
        deleteMany: {},
        createMany: {
          data: data.options.map((opt) => ({
            title: opt.title,
          })),
        },
      },
    },
  });
};

export const deletePollRepo = async (pollId: string) => {
  await prisma.poll.delete({
    where: {
      id: pollId,
    },
  });
};

export const getApartmentIdByAdminId = async (adminId: string) => {
  return await prisma.apartment.findUnique({
    where: {
      adminId,
    },
    select: {
      id: true,
    },
  });
};
