import { NotificationType } from '@prisma/client';

/**
 * SSE 전송 데이터 타입 정의
 */
export interface NotificationPayload {
  notificationId: string;
  content: string;
  notificationType: NotificationType;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string | null;
  noticeId?: string | null;
  pollId?: string | null;
}

/**
 * SSE 이벤트 타입 유니온
 */
// prettier-ignore
export type SseEvent =
  | { event: 'alarm'; data: NotificationPayload[] }
  | { event: 'ping'; data?: Record<string, never> };
