import { Router } from 'express';
import { downloadResidentTemplate } from './residents.file.controller';

const router = Router();

// 입주민 업로드 템플릿 다운로드
router.get('/file/template', downloadResidentTemplate);

export default router;
