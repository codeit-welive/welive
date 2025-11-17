import { Router } from 'express';
import { downloadResidentList, downloadResidentTemplate, uploadResidentListFile } from './residents.file.controller';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import csvParser from '#core/middlewares/csvParser';
import {
  validateCreateResidentRequestBody,
  validatePatchResidentRequestBody,
  validateResidentListRequestQuery,
  validateResidentRequestParam,
  validateCsvHeader,
} from './residents.validator';
import {
  getResidentListHandler,
  getResidentHandler,
  patchResidentHandler,
  deleteResidentHandler,
  createResidentHandler,
} from './residents.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 입주민 업로드 템플릿 다운로드
router.get('/file/template', downloadResidentTemplate);

router
  .route('/file')
  .get(authMiddleware, requireRole(['ADMIN']), validateResidentListRequestQuery, downloadResidentList);

router
  .route('/from-file')
  .post(
    authMiddleware,
    requireRole(['ADMIN']),
    upload.single('file'),
    validateCsvHeader,
    csvParser,
    uploadResidentListFile
  );

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
router
  .route('/')
  .get(authMiddleware, requireRole(['ADMIN']), validateResidentListRequestQuery, getResidentListHandler)
  .post(authMiddleware, requireRole(['ADMIN']), validateCreateResidentRequestBody, createResidentHandler);

export default router;
