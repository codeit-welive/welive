import ApiError from '#errors/ApiError';
import { BoardType, ComplaintStatus, Prisma } from '@prisma/client';
import { ComplaintDetailResponseDto, CommentResponseDto, ComplaintListItemResponseDto } from './dto/response.dto.js';
import { ComplaintListQuery } from './dto/querys.dto.js';
import * as ComplaintRepo from './complaints.repo.js';
import { COMPLAINT_ERROR_MESSAGES } from '#constants/complaint.constant';

// ==================== 검증 함수 ====================

/**
 * 사용자의 민원 게시판 ID 조회 및 검증
 */
export const validateComplaintBoard = async (userId: string): Promise<string> => {
  const boardId = await ComplaintRepo.getComplaintBoardIdByUserId(userId);

  if (!boardId) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.BOARD_NOT_FOUND);
  }

  return boardId;
};

/**
 * 민원 작성자 본인 확인 (USER용)
 */
export const verifyComplaintAuthor = async (
  complaintId: string,
  userId: string
): Promise<{ userId: string; status: ComplaintStatus }> => {
  const complaint = await ComplaintRepo.getUserIdByComplaintId(complaintId);

  if (!complaint) {
    throw ApiError.notFound(COMPLAINT_ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
  }

  if (complaint.userId !== userId) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_COMPLAINT_PERMISSION);
  }

  return complaint;
};

/**
 * 아파트 관리자 권한 확인 (ADMIN용)
 */
export const verifyApartmentAdmin = async (complaintId: string, userId: string): Promise<void> => {
  const adminId = await ComplaintRepo.getComplaintWithBoardInfo(complaintId);

  if (!adminId) {
    throw ApiError.notFound(COMPLAINT_ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
  }

  if (adminId !== userId) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_ADMIN_PERMISSION);
  }
};

// ==================== 필터 조건 생성 ====================

/**
 * 민원 목록 조회용 where 조건 생성
 */
export const buildComplaintWhereConditions = (
  boardId: string,
  query: ComplaintListQuery
): Prisma.ComplaintWhereInput => {
  const whereConditions: Prisma.ComplaintWhereInput = {
    boardId,
  };

  // 상태 필터
  if (query.status) {
    whereConditions.status = query.status;
  }

  // 공개 여부 필터
  if (query.isPublic !== undefined) {
    whereConditions.isPublic = query.isPublic;
  }

  // 동/호 필터
  if (query.dong || query.ho) {
    const residentFilter: Prisma.ResidentWhereInput = {};

    if (query.dong) {
      residentFilter.building = query.dong;
    }

    if (query.ho) {
      residentFilter.unitNumber = query.ho;
    }

    whereConditions.user = {
      resident: {
        isNot: null,
        is: residentFilter,
      },
    };
  }

  // 키워드 검색 (제목만)
  if (query.keyword) {
    whereConditions.title = {
      contains: query.keyword,
      mode: 'insensitive',
    };
  }

  return whereConditions;
};

// ==================== 응답 매핑 함수 ====================

// 상세 응답 매핑 함수
export const mapComplaintToDetailResponse = (complaint: {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: ComplaintStatus;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewsCount: number;
  _count: { comments: number };
  user: {
    name: string;
    resident: {
      building: string;
      unitNumber: string;
    } | null;
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      name: string;
    };
  }>;
}): ComplaintDetailResponseDto => {
  if (!complaint.user.resident) {
    throw ApiError.internal(COMPLAINT_ERROR_MESSAGES.RESIDENT_NOT_FOUND);
  }

  return {
    complaintId: complaint.id,
    userId: complaint.userId,
    title: complaint.title,
    writerName: complaint.user.name,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    isPublic: complaint.isPublic,
    viewsCount: complaint.viewsCount,
    commentsCount: complaint._count.comments,
    status: complaint.status,
    dong: complaint.user.resident.building,
    ho: complaint.user.resident.unitNumber,
    content: complaint.content,
    boardType: BoardType.COMPLAINT,
    comments: complaint.comments.map(
      (comment): CommentResponseDto => ({
        id: comment.id,
        userId: comment.user.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        writerName: comment.user.name,
      })
    ),
  };
};

// 목록 응답 매핑 함수
export const mapComplaintToListItemResponse = (complaint: {
  id: string;
  userId: string;
  title: string;
  status: ComplaintStatus;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewsCount: number;
  _count: { comments: number };
  user: {
    name: string;
    resident: {
      building: string;
      unitNumber: string;
    } | null;
  };
}): ComplaintListItemResponseDto => {
  if (!complaint.user.resident) {
    throw ApiError.internal(COMPLAINT_ERROR_MESSAGES.RESIDENT_NOT_FOUND);
  }

  return {
    complaintId: complaint.id,
    userId: complaint.userId,
    title: complaint.title,
    writerName: complaint.user.name,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    isPublic: complaint.isPublic,
    viewsCount: complaint.viewsCount,
    commentsCount: complaint._count.comments,
    status: complaint.status,
    dong: complaint.user.resident.building,
    ho: complaint.user.resident.unitNumber,
  };
};
