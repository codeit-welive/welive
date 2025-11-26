import ApiError from '#errors/ApiError';
import * as ComplaintRepo from './complaints.repo';
import {
  ComplaintCreateDto,
  ComplaintPatchDto,
  ComplaintPatchStatusDto,
  ComplaintDeleteDto,
} from './dto/complaints.dto';
import { ComplaintListQuery } from './dto/querys.dto';
import {
  mapComplaintToDetailResponse,
  mapComplaintToListItemResponse,
  validateComplaintBoard,
  verifyComplaintAuthor,
  verifyApartmentAdmin,
} from './complaints.util';
import { ComplaintStatus, UserRole } from '@prisma/client';
import { COMPLAINT_ERROR_MESSAGES, COMPLAINT_STATUS_NOTIFICATIONS } from '#constants/complaint.constant';
import { createAndSendNotification } from '#core/utils/notificationHelper';

/**
 * 민원 생성
 * @description USER가 민원을 생성합니다. 본인이 속한 아파트의 게시판에만 민원 작성 가능
 * @param data - 민원 생성 데이터 (userId, boardId, title, content, isPublic)
 * @returns void
 * @throws ApiError.forbidden - 게시판 권한 없음 (다른 아파트 게시판에 작성 시도)
 */
export const createComplaint = async (data: ComplaintCreateDto) => {
  // 사용자의 게시판 권한 검증 (adminId도 함께 조회)
  const userBoard = await validateComplaintBoard(data.userId);

  if (data.boardId !== userBoard.id) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_BOARD_PERMISSION);
  }
  if (!userBoard.apartment.adminId) {
    throw ApiError.forbidden(COMPLAINT_ERROR_MESSAGES.NO_ADMIN_PERMISSION);
  }

  // 민원 생성
  const complaint = await ComplaintRepo.create(data);

  // 관리자에게 알림 전송
  createAndSendNotification(
    {
      content: '새로운 민원이 작성되었습니다.',
      notificationType: 'COMPLAINT_REQ',
      recipientId: userBoard.apartment.adminId,
      complaintId: complaint.id,
    },
    userBoard.apartment.adminId
  );
};

/**
 * 민원 목록 조회 (페이지네이션)
 * @description 권한에 따라 민원 목록을 조회합니다
 *   - USER: 본인이 속한 아파트 게시판의 민원 목록 (공개 민원 + 본인 작성 민원)
 *   - ADMIN: 관리하는 아파트의 모든 민원 목록
 * @param userId - 사용자 ID
 * @param role - 사용자 역할 (USER | ADMIN)
 * @param query - 목록 조회 쿼리 (status, page, limit)
 * @returns 민원 목록과 전체 개수 { complaints: ComplaintListItemResponse[], totalCount: number }
 * @throws ApiError.forbidden - 게시판 없음 (ADMIN이 관리하는 아파트가 없는 경우)
 */
export const getComplaintList = async (userId: string, role: UserRole, query: ComplaintListQuery) => {
  // 사용자의 게시판 ID 조회
  if (role === UserRole.USER) {
    const userBoard = await validateComplaintBoard(userId);

    // 민원 목록 + 전체 개수 병렬 조회
    const [complaints, totalCount] = await Promise.all([
      ComplaintRepo.getList(userBoard.id, query),
      ComplaintRepo.getCount(userBoard.id, query),
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
 * @description 민원 상세 정보를 조회합니다. 권한 검증 후 조회수를 증가시킵니다
 *   - USER: 본인이 속한 아파트 게시판의 민원만 조회 가능, 비공개 민원은 작성자만 조회 가능
 *   - ADMIN: 관리하는 아파트의 모든 민원 조회 가능
 *   - 조회수는 작성자 본인이 아닐 때만 증가
 * @param complaintId - 민원 ID
 * @param userId - 사용자 ID
 * @param role - 사용자 역할 (USER | ADMIN)
 * @returns 민원 상세 정보 (ComplaintDetailResponse)
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 조회 권한 없음 (다른 아파트 민원, 비공개 민원 등)
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
    const userBoard = await validateComplaintBoard(userId);
    if (complaint.boardId !== userBoard.id) {
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
 * @description USER가 본인이 작성한 민원을 수정합니다. PENDING 상태의 민원만 수정 가능
 * @param complaintId - 민원 ID
 * @param loginUserId - 로그인한 사용자 ID
 * @param data - 수정할 데이터 (title, content, isPublic)
 * @returns 수정된 민원 정보 (ComplaintListItemResponse)
 * @throws ApiError.badRequest - 수정할 데이터 없음
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 수정 권한 없음 (작성자 본인 아님), 또는 수정 불가 상태 (IN_PROGRESS, COMPLETED, REJECTED)
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
 * @description ADMIN이 민원의 상태를 변경합니다 (PENDING → IN_PROGRESS → COMPLETED 또는 REJECTED)
 * @param complaintId - 민원 ID
 * @param data - 상태 변경 데이터 (userId, status)
 * @returns 상태가 변경된 민원 정보 (ComplaintDetailResponse)
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 권한 없음 (관리하는 아파트의 민원이 아님)
 */
export const patchComplaintStatus = async (complaintId: string, data: ComplaintPatchStatusDto) => {
  // 관리자 권한 확인
  await verifyApartmentAdmin(complaintId, data.userId);

  // 상태 업데이트
  const updatedComplaint = await ComplaintRepo.patchStatus(complaintId, data.status);

  // 민원 작성자에게 상태 변경 알림 전송
  const notification = COMPLAINT_STATUS_NOTIFICATIONS[data.status];
  if (notification) {
    createAndSendNotification(
      {
        content: notification.content,
        notificationType: notification.type,
        recipientId: updatedComplaint.userId,
        complaintId: updatedComplaint.id,
      },
      updatedComplaint.userId
    );
  }

  return mapComplaintToDetailResponse(updatedComplaint);
};

/**
 * 민원 삭제
 * @description 권한에 따라 민원을 삭제합니다
 *   - USER: 본인이 작성한 PENDING 상태 민원만 삭제 가능
 *   - ADMIN: 관리하는 아파트의 모든 민원 삭제 가능 (상태 무관)
 * @param complaintId - 민원 ID
 * @param userData - 사용자 데이터 (userId, role)
 * @returns void
 * @throws ApiError.notFound - 민원 없음
 * @throws ApiError.forbidden - 삭제 권한 없음 (작성자 본인 아님, 또는 USER의 경우 PENDING 상태 아님)
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
