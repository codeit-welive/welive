import { Router } from 'express';
import { downloadResidentTemplate } from './residents.file.controller';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import {
  validateCreateResidentRequestBody,
  validatePatchResidentRequestBody,
  validateResidentListRequestQuery,
  validateResidentRequestParam,
} from './residents.validator';
import {
  getResidentListHandler,
  getResidentHandler,
  patchResidentHandler,
  deleteResidentHandler,
  createResidentHandler,
} from './residents.controller';

const router = Router();

// 입주민 업로드 템플릿 다운로드
router.get('/file/template', downloadResidentTemplate);

router
  .route('/')
  .get(authMiddleware, requireRole(['ADMIN']), validateResidentListRequestQuery, getResidentListHandler)
  .post(authMiddleware, requireRole(['ADMIN']), validateCreateResidentRequestBody, createResidentHandler);

router
  .route('/:id')
  .get(authMiddleware, requireRole(['ADMIN']), validateResidentRequestParam, getResidentHandler)
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validateResidentRequestParam,
    validatePatchResidentRequestBody,
    patchResidentHandler
  )
  .delete(authMiddleware, requireRole(['ADMIN']), validateResidentRequestParam, deleteResidentHandler);

export default router;
