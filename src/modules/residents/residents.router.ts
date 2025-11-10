import { Router } from 'express';
import { downloadResidentTemplate } from './residents.file.controller';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import { validateResidentListRequestQuery, validateResidentRequestParam } from './residents.validator';
import { getResidentListHandler, getResidentHandler } from './residents.controller';

const router = Router();

// 입주민 업로드 템플릿 다운로드
router.get('/file/template', downloadResidentTemplate);

router.get('/', authMiddleware, requireRole(['ADMIN']), validateResidentListRequestQuery, getResidentListHandler);
router.get('/:id', authMiddleware, requireRole(['ADMIN']), validateResidentRequestParam, getResidentHandler);

export default router;
