import prisma from '../prisma';
import { sendSseToUser } from '#sse/sseEmitter';
import type { NotificationPayload } from '#sse/types';
import type { NotificationType } from '@prisma/client';
import { logger } from '#core/logger';

/**
 * 알림 생성에 필요한 데이터
 */
export interface CreateNotificationData {
  /** 알림 내용 */
  content: string;
  /** 알림 타입 (GENERAL, SIGNUP_REQ, COMPLAINT_REQ 등) */
  notificationType: NotificationType;
  /** DB에 기록할 수신자 ID (이벤트 주체자) */
  recipientId: string;
  /** 민원 ID (선택) */
  complaintId?: string;
  /** 공지사항 ID (선택) */
  noticeId?: string;
  /** 투표 ID (선택) */
  pollId?: string;
}

/**
 * 알림 생성 및 SSE 전송 (범용)
 *
 * @param data - 알림 생성에 필요한 데이터
 * @param sendToUserId - SSE를 전송할 사용자 ID (실제 알림을 받을 사람)
 *
 * @description
 * - DB에 알림을 저장하고 지정된 사용자에게 SSE로 실시간 전송
 * - `data.recipientId`: DB에 기록되는 수신자 (이벤트 주체자)
 * - `sendToUserId`: 실제로 SSE를 받을 사용자 (알림 수신자)
 * - 알림 생성/전송 실패 시에도 에러를 던지지 않음 (로깅만 수행)
 */
export async function createAndSendNotification(data: CreateNotificationData, sendToUserId: string): Promise<void> {
  try {
    // 1. 알림 DB 생성
    const notification = await prisma.notification.create({
      data,
    });

    // 2. SSE 페이로드 구성
    const payload: NotificationPayload = {
      notificationId: notification.id,
      content: notification.content,
      notificationType: notification.notificationType,
      notifiedAt: notification.notifiedAt.toISOString(),
      isChecked: notification.isChecked,
      complaintId: notification.complaintId,
      noticeId: notification.noticeId,
      pollId: notification.pollId,
    };

    // 3. SSE 전송 (내부에서 에러 처리 및 로깅됨)
    sendSseToUser(sendToUserId, payload);
  } catch (error) {
    // 알림 DB 생성 실패는 로깅만 하고 에러를 던지지 않음
    logger.sse.error(`알림 DB 생성 실패: ${data.notificationType} - ${error instanceof Error ? error.message : String(error)}`);
  }
}
