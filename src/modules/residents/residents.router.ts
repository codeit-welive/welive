import { Router } from 'express';
import { downloadResidentTemplate } from './residents.file.controller';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import {
  validatePatchResidentRequestBody,
  validateResidentListRequestQuery,
  validateResidentRequestParam,
} from './residents.validator';
import { getResidentListHandler, getResidentHandler, patchResidentHandler } from './residents.controller';

const router = Router();

// 입주민 업로드 템플릿 다운로드
router.get('/file/template', downloadResidentTemplate);

router.get('/', authMiddleware, requireRole(['ADMIN']), validateResidentListRequestQuery, getResidentListHandler);

router
  .route('/:id')
  .get(authMiddleware, requireRole(['ADMIN']), validateResidentRequestParam, getResidentHandler)
  .patch(authMiddleware, requireRole(['ADMIN']), validatePatchResidentRequestBody, patchResidentHandler);

export default router;
