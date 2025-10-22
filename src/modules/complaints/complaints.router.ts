import { Router } from 'express';
import {
  validateComplaintCreate,
  validateComplaintListQuery,
  validateComplaintParams,
  validateComplaintPatch,
} from './complaints.validator.js';
import {
  createComplaintHandler,
  getComplaintListHandler,
  getComplaintHandler,
  patchComplaintHandler,
} from './complaints.controller.js';

const router = Router();

router
  .route('/')
  .post(validateComplaintCreate, createComplaintHandler)
  .get(validateComplaintListQuery, getComplaintListHandler);

router
  .route('/:complaintId')
  .get(validateComplaintParams, getComplaintHandler)
  .patch(validateComplaintParams, validateComplaintPatch, patchComplaintHandler);

export default router;
