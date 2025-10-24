import { NotificationType } from '@prisma/client';

/**
 * SSE 전송 데이터 타입 정의
 */
export interface NotificationPayload {
  id: string;
  content: string;
  type: NotificationType;
  notifiedAt: string;
  isChecked: boolean;
  recipientId: string;
}

/**
 * SSE 이벤트 타입 유니온
 */
// prettier-ignore
export type SseEvent =
  | { event: 'notification'; data: NotificationPayload }
  | { event: 'ping'; data: { ts: number } };
