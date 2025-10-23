import prisma from '../../core/prisma.js';
import { ComplaintCreateDto, ComplaintPatchDto } from './dto/complaints.dto.js';
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

export const getList = async (boardId: string, page: number, limit: number) => {
  return await prisma.complaint.findMany({
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

export const getCount = async (boardId: string) => {
  return await prisma.complaint.count({
    where: { boardId },
  });
};

export const getById = async (complaintId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. 조회수 증가
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    // 2. 증가된 데이터 조회
    return await tx.complaint.findUnique({
      where: { id: complaintId },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        viewsCount: true,
        content: true,
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
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  });
};

export const getUserIdByComplaintId = async (complaintId: string) => {
  return await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      userId: true,
    },
  });
};

export const patch = async (complaintId: string, data: ComplaintPatchDto) => {
  return await prisma.complaint.update({
    where: { id: complaintId },
    data,
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
  });
};
