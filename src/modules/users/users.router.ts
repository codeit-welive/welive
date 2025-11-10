import { Router } from 'express';
import { validateUserUpdate } from './users.validator';
import { updateUserController } from './users.controller';
import authMiddleware from '#core/middlewares/authMiddleware';

const router = Router();

/**
 * PATCH /api/users/me
 */
router.patch(
  '/me',
  //#swagger.tags = ['Users']
  //#swagger.summary = '[사용자] 유저 정보 수정'
  //#swagger.description = '현재 로그인한 사용자의 정보를 수정합니다. 비밀번호 변경 또는 아바타 이미지 업로드가 가능합니다.'
  //#swagger.consumes = ['multipart/form-data']
  //#swagger.requestBody = { required: false, content: { "multipart/form-data": { schema: { type: "object", properties: { currentPassword: { type: "string", description: "현재 비밀번호 (새 비밀번호 설정 시 필요)" }, newPassword: { type: "string", description: "새 비밀번호" }, file: { type: "string", format: "binary", description: "아바타 이미지 파일 (선택사항)" } } } } } }
  //#swagger.responses[200] = { description: '유저 정보 수정 성공', content: { "application/json": { example: { message: "홍길동님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요." } } } }
  //#swagger.responses[400] = { description: '유저 정보 수정 실패' }
  //#swagger.responses[401] = { description: '권한 없음' }
  //#swagger.responses[403] = { description: '권한 없음 (비밀번호 불일치 등)' }
  //#swagger.responses[404] = { description: '사용자를 찾을 수 없음' }
  //#swagger.responses[500] = { description: '서버 내부 오류' }
  authMiddleware,
  validateUserUpdate,
  updateUserController
);

export default router;
