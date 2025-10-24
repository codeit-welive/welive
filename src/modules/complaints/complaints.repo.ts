import prisma from '../../core/prisma.js';
import { ComplaintCreateDto, ComplaintPatchDto } from './dto/complaints.dto.js';
import { ComplaintListQuery } from './dto/querys.dto.js';
import { buildComplaintWhereConditions } from './complaints.util.js';
import { BoardType, ComplaintStatus } from '@prisma/client';

// ==================== Board 관련 조회 ====================

/**
 * 사용자 ID로 민원 게시판 ID 조회
 */
export const getComplaintBoardIdByUserId = async (userId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.COMPLAINT,
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
  return board?.id;
};

export const getComplaintBoardIdByAdminId = async (adminId: string) => {
  const board = await prisma.board.findFirst({
    where: {
      type: BoardType.COMPLAINT,
      apartment: {
        adminId,
      },
    },
    select: {
      id: true,
    },
  });
  return board?.id;
};

// ==================== 민원 생성 ====================

/**
 * 민원 생성
 */
export const create = async (data: ComplaintCreateDto) => {
  return await prisma.complaint.create({
    data,
    select: {
      id: true,
    },
  });
};

// ==================== 민원 조회 ====================

/**
 * 민원 목록 조회 (페이지네이션 + 필터링)
 */
export const getList = async (boardId: string, query: ComplaintListQuery) => {
  const whereConditions = buildComplaintWhereConditions(boardId, query);

  return await prisma.complaint.findMany({
    where: whereConditions,
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
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * 민원 총 개수 조회 (필터링 적용)
 */
export const getCount = async (boardId: string, query: ComplaintListQuery) => {
  const whereConditions = buildComplaintWhereConditions(boardId, query);

  return await prisma.complaint.count({
    where: whereConditions,
  });
};

/**
 * 민원 상세 조회 (조회수 증가 없음 - 권한 검증용)
 */
export const getByIdWithoutIncrement = async (complaintId: string) => {
  return await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      userId: true,
      boardId: true,
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
};

/**
 * 민원 조회수 증가
 */
export const incrementViewCount = async (complaintId: string) => {
  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      viewsCount: {
        increment: 1,
      },
    },
  });
};

/**
 * 민원 ID로 작성자 ID 조회
 */
export const getUserIdByComplaintId = async (complaintId: string) => {
  return await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      userId: true,
      status: true,
    },
  });
};

/**
 * 민원 ID로 게시판 정보 조회 (권한 체크용)
 */
export const getComplaintWithBoardInfo = async (complaintId: string) => {
  const adminId = await prisma.complaint.findUnique({
    where: { id: complaintId },
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
  return adminId?.board.apartment.adminId;
};

// ==================== 민원 수정 ====================

/**
 * 민원 내용 수정 (제목, 내용, 공개여부)
 */
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

/**
 * 민원 상태 변경 (관리자 전용)
 */
export const patchStatus = async (complaintId: string, data: ComplaintStatus) => {
  return await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: data,
    },
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
};

/**
 * 민원 삭제
 */
export const deleteComplaint = async (complaintId: string) => {
  await prisma.complaint.delete({
    where: { id: complaintId },
  });
};
