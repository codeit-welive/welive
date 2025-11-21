import type { Request, Response, NextFunction } from 'express';
import {
  ComplaintCreateDto,
  ComplaintPatchDto,
  ComplaintPatchStatusDto,
  ComplaintDeleteDto,
} from './dto/complaints.dto';
import { ComplaintListQuery } from './dto/querys.dto';
import * as complaintService from './complaints.service';
import { RESPONSE_MESSAGES } from '#constants/response.constant';

/**
 * 민원 생성 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 민원 생성
 * @returns 201 Created - 생성 성공 메시지
 * @throws ApiError - 권한 없음, 아파트 없음 등
 */
export const createComplaintHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as ComplaintCreateDto;
    await complaintService.createComplaint(data);
    res.status(201).json({ message: RESPONSE_MESSAGES.CREATE_SUCCESS });
  } catch (err) {
    next(err);
  }
};

/**
 * 민원 목록 조회 핸들러
 * @description 사용자 권한에 따라 조회 가능한 민원 목록 반환
 *   - USER: 본인이 작성한 민원만 조회
 *   - ADMIN: 관리 아파트의 모든 민원 조회
 * @returns 200 OK - 민원 목록 (페이지네이션 포함)
 * @throws ApiError - 권한 없음
 */
export const getComplaintListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const query = res.locals.validatedQuery as ComplaintListQuery;
    const complaints = await complaintService.getComplaintList(userId, role, query);
    res.status(200).json(complaints);
  } catch (err) {
    next(err);
  }
};

/**
 * 민원 상세 조회 핸들러
 * @description 사용자 권한에 따라 민원 상세 정보 반환
 *   - USER: 본인이 작성한 민원만 조회 가능
 *   - ADMIN: 관리 아파트의 모든 민원 조회 가능
 * @returns 200 OK - 민원 상세 정보
 * @throws ApiError - 민원 없음, 조회 권한 없음
 */
export const getComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userId = req.user.id;
    const role = req.user.role;
    const complaint = await complaintService.getComplaint(complaintId, userId, role);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * 민원 수정 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 민원 수정
 * @returns 200 OK - 수정된 민원 정보
 * @throws ApiError - 민원 없음, 수정 권한 없음 (본인 민원만 수정 가능)
 */
export const patchComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userId = req.user.id;
    const data = res.locals.validatedBody as ComplaintPatchDto;
    const complaint = await complaintService.patchComplaint(complaintId, userId, data);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * 민원 상태 변경 핸들러
 * @description ADMIN이 민원 상태를 변경 (접수 중, 처리 중, 완료, 반려)
 * @returns 200 OK - 상태가 변경된 민원 정보
 * @throws ApiError - 민원 없음, 권한 없음 (ADMIN 전용)
 */
export const patchComplaintStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const data = res.locals.validatedBody as ComplaintPatchStatusDto;
    const complaint = await complaintService.patchComplaintStatus(complaintId, data);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

/**
 * 민원 삭제 핸들러
 * @description Validator에서 검증된 데이터를 Service로 전달하여 민원 삭제
 * @returns 200 OK - 삭제 성공 메시지
 * @throws ApiError - 민원 없음, 삭제 권한 없음
 *   - USER: 본인 민원만 삭제 가능
 *   - ADMIN: 관리 아파트의 모든 민원 삭제 가능
 */
export const deleteComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userData = res.locals.validatedBody as ComplaintDeleteDto;
    await complaintService.deleteComplaint(complaintId, userData);
    res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    next(err);
  }
};
