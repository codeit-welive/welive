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

const router = Router();

router
  .route('/')
  .post(authMiddleware, requireRole(['USER']), validateComplaintCreate, createComplaintHandler)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateComplaintListQuery, getComplaintListHandler);

router
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

router
  .route('/:complaintId/status')
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validateComplaintParams,
    validateComplaintPatchStatus,
    patchComplaintStatusHandler
  );

export default router;
