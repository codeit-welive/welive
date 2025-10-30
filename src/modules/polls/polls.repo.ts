import prisma from '#core/prisma';
import { Prisma, User } from '@prisma/client';
import { createPollBodyDTO } from './dto/polls.dto';

export const getApartment = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      apartment: true,
    },
  });
};

export const createPollRepo = async (data: createPollBodyDTO) => {
  await prisma.poll.create({
    data: {
      boardId: data.boardId,
      userId: data.userId,
      title: data.title,
      content: data.content,
      buildingPermission: data.buildingPermission,
      startDate: data.startDate,
      endDate: data.endDate,
      options: {
        create: data.options.map((opt: any) => ({
          title: opt.title,
        })),
      },
    },
  });
  return 1;
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

export const deletePollRepo = async (pollId: string) => {
  await prisma.poll.delete({
    where: {
      id: pollId,
    },
  });
};
