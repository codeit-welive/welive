import { Router } from 'express';
import { validateComplaintCreate, validateComplaintListQuery } from './complaints.validator.js';
import { createComplaintHandler, getComplaintListHandler } from './complaints.controller.js';

const router = Router();

router
  .route('/')
  .post(validateComplaintCreate, createComplaintHandler)
  .get(validateComplaintListQuery, getComplaintListHandler);

export default router;
