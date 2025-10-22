import prisma from '../../core/prisma.js';
import { ComplaintCreateDto } from './dto/complaints.dto.js';
import { BoardType } from '@prisma/client';

export const getComplaintBoardIdByUserId = async (userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.COMPLAINT,
      apartment: {
        residents: {
          some: {
            userId,
            isRegistered: true,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return board?.id;
};

export const create = async (data: ComplaintCreateDto) => {
  return await prisma.complaint.create({
    data,
    select: {
      id: true,
    },
  });
};

export const getList = (boardId: string, page: number, limit: number) => {
  return prisma.complaint.findMany({
    where: { boardId },
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      viewsCount: true,
      _count: {
        select: {
          comments: true,
        },
      },
      user: {
        select: {
          name: true,
          resident: {
            select: {
              building: true, // dong
              unitNumber: true, // ho
            },
          },
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
};

export const getCount = (boardId: string) => {
  return prisma.complaint.count({
    where: { boardId },
  });
};
