import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import {
  validateComplaintCreate,
  validateComplaintListQuery,
  validateComplaintParams,
  validateComplaintPatch,
  validateComplaintPatchStatus,
  validateComplaintDelete,
} from './complaints.validator';
import {
  createComplaintHandler,
  getComplaintListHandler,
  getComplaintHandler,
  patchComplaintHandler,
  patchComplaintStatusHandler,
  deleteComplaintHandler,
} from './complaints.controller';

const complaintRouter = Router();

/**
 * POST /complaints
 * 민원 생성 (USER만 가능)
 *
 * GET /complaints
 * 민원 목록 조회 (ADMIN, USER)
 */
complaintRouter
  .route('/')
  .post(authMiddleware, requireRole(['USER']), validateComplaintCreate, createComplaintHandler)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateComplaintListQuery, getComplaintListHandler);

/**
 * GET /complaints/:complaintId
 * 민원 상세 조회 (ADMIN, USER)
 *
 * PATCH /complaints/:complaintId
 * 민원 수정 - 본인이 작성한 민원만 수정 가능 (USER만 가능)
 *
 * DELETE /complaints/:complaintId
 * 민원 삭제 - USER: 본인만, ADMIN: 관리 아파트 모든 민원
 */
complaintRouter
  .route('/:complaintId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateComplaintParams, getComplaintHandler)
  .patch(authMiddleware, requireRole(['USER']), validateComplaintParams, validateComplaintPatch, patchComplaintHandler)
  .delete(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateComplaintParams,
    validateComplaintDelete,
    deleteComplaintHandler
  );

/**
 * PATCH /complaints/:complaintId/status
 * 민원 상태 변경 (ADMIN만 가능)
 */
complaintRouter
  .route('/:complaintId/status')
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validateComplaintParams,
    validateComplaintPatchStatus,
    patchComplaintStatusHandler
  );

export default complaintRouter;
