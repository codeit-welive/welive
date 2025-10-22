import { Router } from 'express';
import {
  validateComplaintCreate,
  validateComplaintListQuery,
  validateConmplaintParams,
} from './complaints.validator.js';
import { createComplaintHandler, getComplaintListHandler, getComplaintHandler } from './complaints.controller.js';

const router = Router();

router
  .route('/')
  .post(validateComplaintCreate, createComplaintHandler)
  .get(validateComplaintListQuery, getComplaintListHandler);

router.route('/:compaintId').get(validateConmplaintParams, getComplaintHandler);

export default router;
