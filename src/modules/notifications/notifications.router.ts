/**
 * @file modules/notifications/notifications.router.ts
 * @description Notification REST 라우트 정의
 */

import { Router } from 'express';
import authMiddleware from '#core/middlewares/authMiddleware';
import { markNotificationAsReadController } from './notifications.controller';

const router = Router();

/**
 * PATCH /api/notifications/{notificationId}/read
 */
router.patch(
  '/:id/read',
  //#swagger.tags = ['Notifications']
  //#swagger.summary = '[알림] 단일 알림 읽음 처리'
  //#swagger.description = '지정한 알림을 읽음 처리합니다. 본인에게 전송된 알림만 읽음 처리할 수 있습니다.'
  //#swagger.parameters['notificationId'] = { in: 'path', description: '알림 ID (UUID)', required: true, type: 'string' }
  //#swagger.responses[200] = {
  //#swagger.description = '알림 읽음 처리 성공',
  //#swagger.content = { "application/json": { example: { message: "알림을 읽음 처리했습니다.", notificationId: "알림 UUID" } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (알림 ID 누락 등)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[404] = { description: '알림을 찾을 수 없거나 권한 없음' }
  authMiddleware,
  markNotificationAsReadController
);

export default router;
