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
  //#swagger.summary = '[알림] 알림 읽음 처리'
  //#swagger.description = '지정한 알림을 읽음 상태(isChecked: true)로 변경합니다. 본인에게 전송된 알림만 읽음 처리할 수 있습니다.'
  //#swagger.parameters['id'] = { in: 'path', description: '읽음 처리할 알림의 UUID', required: true, schema: { type: 'string', format: 'uuid' } }
  //#swagger.responses[200] = { description: '읽음 처리된 알림 반환', content: { "application/json": { example: { notificationId: "uuid-1234", content: "민원 처리가 완료되었습니다.", notificationType: "COMPLAINT_RESOLVED", notifiedAt: "2025-06-13T12:34:56.789Z", isChecked: true, complaintId: "complaint-uuid-9876", noticeId: "notice-uuid-1111", pollId: "poll-uuid-2222" } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (알림 ID 누락 등)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[404] = { description: '알림을 찾을 수 없거나 권한 없음' }
  authMiddleware,
  markNotificationAsReadController
);

export default router;
