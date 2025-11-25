import ApiError from '#errors/ApiError';
import { BoardType, ComplaintStatus, Prisma } from '@prisma/client';
import { ComplaintDetailResponseDto, CommentResponseDto, ComplaintListItemResponseDto } from './dto/response.dto';
import { ComplaintListQuery } from './dto/querys.dto';
import * as ComplaintRepo from './complaints.repo';
import { COMPLAINT_ERROR_MESSAGES } from '#constants/complaint.constant';

// ==================== 검증 함수 ====================

/**
 * 사용자의 민원 게시판 ID 조회 및 검증
 * @description USER가 속한 아파트의 민원 게시판 ID를 조회합니다
 * @param userId - 사용자 ID
 * @returns 민원 게시판 ID
 * @throws ApiError.forbidden - 게시판 없음 (사용자가 아파트에 속하지 않음)
 */
export const validateComplaintBoard = async (userId: string) => {
  const boardId = await ComplaintRepo.getComplaintBoardIdByUserId(userId);

  if (!boardId?.id) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.BOARD_NOT_FOUND);
  }

  return boardId;
};

/**
 * 민원 작성자 본인 확인 (USER용)
 * @description 민원의 작성자가 본인인지 확인합니다. 주로 수정/삭제 시 사용
 * @param complaintId - 민원 ID
 * @param userId - 확인할 사용자 ID
 * @returns 민원의 userId와 status
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 작성자 본인 아님
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
 * @description ADMIN이 해당 민원을 관리할 수 있는 권한이 있는지 확인합니다
 *   민원이 속한 아파트의 관리자인지 검증
 * @param complaintId - 민원 ID
 * @param userId - 확인할 ADMIN ID
 * @returns void
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 관리 권한 없음 (해당 아파트 관리자 아님)
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
 * @description 쿼리 파라미터를 기반으로 Prisma where 조건을 생성합니다
 * @param boardId - 게시판 ID
 * @param query - 목록 조회 쿼리 (status, isPublic, dong, ho, keyword)
 * @returns Prisma where 조건 객체
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

/**
 * 민원 상세 응답 매핑 함수
 * @description DB에서 조회한 민원 상세 데이터를 클라이언트 응답 형식으로 변환
 * @param complaint - DB에서 조회한 민원 데이터 (user, comments 포함)
 * @returns 민원 상세 응답 DTO (ComplaintDetailResponseDto)
 * @throws ApiError.internal - 거주자 정보 없음 (데이터 무결성 오류)
 */
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

/**
 * 민원 목록 아이템 응답 매핑 함수
 * @description DB에서 조회한 민원 목록 데이터를 클라이언트 응답 형식으로 변환
 * @param complaint - DB에서 조회한 민원 데이터 (user 포함, content 제외)
 * @returns 민원 목록 아이템 응답 DTO (ComplaintListItemResponseDto)
 * @throws ApiError.internal - 거주자 정보 없음 (데이터 무결성 오류)
 */
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
