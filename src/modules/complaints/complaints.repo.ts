import prisma from '../../core/prisma';
import { ComplaintCreateDto, ComplaintPatchDto } from './dto/complaints.dto';
import { ComplaintRawResponseDto } from './dto/response.dto';
import { ComplaintListQuery } from './dto/querys.dto';
import { buildComplaintWhereConditions } from './complaints.util';
import { BoardType, ComplaintStatus } from '@prisma/client';

// ==================== Board 관련 조회 ====================

/**
 * 사용자 ID로 민원 게시판 ID 조회
 * @description USER가 속한 아파트의 민원 게시판 ID를 조회합니다
 * @param userId - 사용자 ID
 * @returns 민원 게시판 ID (없으면 undefined)
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
      apartment: {
        select: {
          adminId: true,
        },
      },
    },
  });
  return board;
};

/**
 * 관리자 ID로 민원 게시판 ID 조회
 * @description ADMIN이 관리하는 아파트의 민원 게시판 ID를 조회합니다
 * @param adminId - 관리자 ID
 * @returns 민원 게시판 ID (없으면 undefined)
 */
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
 * @description 새로운 민원을 생성합니다
 * @param data - 민원 생성 데이터 (userId, boardId, title, content, isPublic)
 * @returns 생성된 민원 ID
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
 * @description 게시판의 민원 목록을 조회합니다. 쿼리에 따라 필터링 및 페이지네이션 적용
 * @param boardId - 게시판 ID
 * @param query - 목록 조회 쿼리 (status, isPublic, dong, ho, keyword, page, limit)
 * @returns 민원 목록 (작성자, 댓글 수 포함, 내용 제외)
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
 * @description 게시판의 민원 총 개수를 조회합니다. 쿼리 필터링 조건 적용
 * @param boardId - 게시판 ID
 * @param query - 목록 조회 쿼리 (status, isPublic, dong, ho, keyword)
 * @returns 필터링된 민원 총 개수
 */
export const getCount = async (boardId: string, query: ComplaintListQuery) => {
  const whereConditions = buildComplaintWhereConditions(boardId, query);

  return await prisma.complaint.count({
    where: whereConditions,
  });
};

/**
 * 민원 상세 조회 (조회수 증가 없음 - 권한 검증용)
 * @description 민원 상세 정보를 조회합니다. 조회수를 증가시키지 않음 (권한 검증 후 증가)
 * @param complaintId - 민원 ID
 * @returns 민원 상세 정보 (작성자, 댓글 목록 포함) 또는 null
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
 * @description 민원의 조회수를 1 증가시킵니다
 * @param complaintId - 민원 ID
 * @returns void
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
 * @description 민원의 작성자 ID와 상태를 조회합니다. 작성자 본인 확인 시 사용
 * @param complaintId - 민원 ID
 * @returns 작성자 ID와 상태 또는 null
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
 * @description 민원이 속한 아파트의 관리자 ID를 조회합니다. ADMIN 권한 확인 시 사용
 * @param complaintId - 민원 ID
 * @returns 아파트 관리자 ID (없으면 undefined)
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
 * @description 민원의 제목, 내용, 공개여부를 수정합니다
 * @param complaintId - 민원 ID
 * @param data - 수정할 데이터 (title, content, isPublic 중 1개 이상)
 * @returns 수정된 민원 정보 (작성자, 댓글 수 포함)
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
 * @description 민원의 처리 상태를 변경합니다 (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
 * @param complaintId - 민원 ID
 * @param data - 변경할 상태 (ComplaintStatus)
 * @returns 상태가 변경된 민원 상세 정보 (작성자, 댓글 목록 포함)
 */
export const patchStatus = async (
  complaintId: string,
  data: ComplaintStatus,
): Promise<ComplaintRawResponseDto> => {
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

// ==================== 민원 삭제 ====================

/**
 * 민원 삭제
 * @description 민원을 삭제합니다
 * @param complaintId - 민원 ID
 * @returns void
 */
export const deleteComplaint = async (complaintId: string) => {
  await prisma.complaint.delete({
    where: { id: complaintId },
  });
};
