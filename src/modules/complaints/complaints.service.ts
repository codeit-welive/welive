import ApiError from '#errors/ApiError';
import * as ComplaintRepo from './complaints.repo.js';
import {
  ComplaintCreateDto,
  ComplaintPatchDto,
  ComplaintPatchStatusDto,
  ComplaintDeleteDto,
} from './dto/complaints.dto.js';
import { ComplaintListQuery } from './dto/querys.dto.js';
import {
  mapComplaintToDetailResponse,
  mapComplaintToListItemResponse,
  validateComplaintBoard,
  verifyComplaintAuthor,
  verifyApartmentAdmin,
} from './complaints.util.js';
import { ComplaintStatus, UserRole } from '@prisma/client';
import { COMPLAINT_ERROR_MESSAGES } from '#constants/complaint.constant';

/**
 * 민원 생성
 */
export const createComplaint = async (data: ComplaintCreateDto) => {
  // 사용자의 게시판 권한 검증
  const userBoardId = await validateComplaintBoard(data.userId);
  if (data.boardId !== userBoardId) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_BOARD_PERMISSION);
  }

  // 민원 생성
  await ComplaintRepo.create(data);
};

/**
 * 민원 목록 조회 (페이지네이션)
 */
export const getComplaintList = async (userId: string, role: UserRole, query: ComplaintListQuery) => {
  // 사용자의 게시판 ID 조회
  if (role === UserRole.USER) {
    const boardId = await validateComplaintBoard(userId);

    // 민원 목록 + 전체 개수 병렬 조회
    const [complaints, totalCount] = await Promise.all([
      ComplaintRepo.getList(boardId, query),
      ComplaintRepo.getCount(boardId, query),
    ]);

    // 응답 형식 변환
    return {
      complaints: complaints.map(mapComplaintToListItemResponse),
      totalCount,
    };
  } else if (role === UserRole.ADMIN) {
    // 관리자의 게시판 ID 조회
    const boardId = await ComplaintRepo.getComplaintBoardIdByAdminId(userId);
    if (!boardId) {
      throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.BOARD_NOT_FOUND);
    }

    // 민원 목록 + 전체 개수 병렬 조회
    const [complaints, totalCount] = await Promise.all([
      ComplaintRepo.getList(boardId, query),
      ComplaintRepo.getCount(boardId, query),
    ]);

    // 응답 형식 변환
    return {
      complaints: complaints.map(mapComplaintToListItemResponse),
      totalCount,
    };
  }
};

/**
 * 민원 상세 조회 (조회수 증가)
 */
export const getComplaint = async (complaintId: string, userId: string, role: UserRole) => {
  // 1. 먼저 민원 조회 (조회수 증가 없이)
  const complaint = await ComplaintRepo.getByIdWithoutIncrement(complaintId);

  if (!complaint) {
    throw ApiError.notFound(COMPLAINT_ERROR_MESSAGES.COMPLAINT_NOT_FOUND);
  }

  // 2. 권한 검증 (조회수 증가 전에 수행)
  if (role === UserRole.USER) {
    // USER의 경우: 같은 아파트 검증
    const userBoardId = await validateComplaintBoard(userId);
    if (complaint.boardId !== userBoardId) {
      throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_COMPLAINT_ACCESS);
    }

    // 비공개 민원은 작성자 본인만 조회 가능
    if (!complaint.isPublic && complaint.userId !== userId) {
      throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.PRIVATE_COMPLAINT_RESTRICTED);
    }
  } else if (role === UserRole.ADMIN) {
    // ADMIN의 경우: 자기 아파트 민원인지 검증
    const adminBoardId = await ComplaintRepo.getComplaintBoardIdByAdminId(userId);
    if (!adminBoardId || complaint.boardId !== adminBoardId) {
      throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_COMPLAINT_ACCESS);
    }
  }

  // 3. 권한 검증 통과 후 조회수 증가 (작성자 본인 제외)
  if (complaint.userId !== userId) {
    await ComplaintRepo.incrementViewCount(complaintId);
  }

  return mapComplaintToDetailResponse(complaint);
};

/**
 * 민원 수정 (제목, 내용, 공개여부)
 */
export const patchComplaint = async (complaintId: string, loginUserId: string, data: ComplaintPatchDto) => {
  // 수정할 내용이 있는지 확인
  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest(COMPLAINT_ERROR_MESSAGES.NO_UPDATE_DATA);
  }

  // 작성자 본인 확인
  const complaint = await verifyComplaintAuthor(complaintId, loginUserId);

  // 민원 상태 확인 (PENDING만 수정 가능)
  if (complaint.status !== ComplaintStatus.PENDING) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.CANNOT_EDIT_IN_PROGRESS);
  }

  // 민원 수정
  const updatedComplaint = await ComplaintRepo.patch(complaintId, data);

  return mapComplaintToListItemResponse(updatedComplaint);
};

/**
 * 민원 상태 변경 (관리자 전용)
 */
export const patchComplaintStatus = async (complaintId: string, data: ComplaintPatchStatusDto) => {
  // 관리자 권한 확인
  await verifyApartmentAdmin(complaintId, data.userId);

  // 상태 업데이트
  const updatedComplaint = await ComplaintRepo.patchStatus(complaintId, data.status);

  return mapComplaintToDetailResponse(updatedComplaint);
};

/**
 * 민원 삭제
 */
export const deleteComplaint = async (complaintId: string, userData: ComplaintDeleteDto) => {
  if (userData.role === UserRole.USER) {
    // 작성자 본인 확인
    const complaint = await verifyComplaintAuthor(complaintId, userData.userId);

    // 민원 상태 확인
    if (complaint.status !== ComplaintStatus.PENDING) {
      throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.CANNOT_DELETE_IN_PROGRESS);
    }

    // 민원 삭제
    await ComplaintRepo.deleteComplaint(complaintId);
  } else if (userData.role === UserRole.ADMIN) {
    // 관리자 권한 확인
    await verifyApartmentAdmin(complaintId, userData.userId);

    // 민원 삭제
    await ComplaintRepo.deleteComplaint(complaintId);
  }
};
