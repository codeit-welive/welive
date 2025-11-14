/**
 * @file modules/notifications/notifications.service.ts
 * @description Notifications 비즈니스 로직 레이어
 */

import ApiError from '#errors/ApiError';
import { markNotificationAsReadRepo } from './notifications.repo';

/**
 * 알림 읽음 처리 서비스
 * @param notificationId - 읽음 처리할 알림 ID
 * @param recipientId - 현재 로그인한 유저 ID
 */
export const markNotificationAsReadService = async (notificationId: string, recipientId: string): Promise<void> => {
  const result = await markNotificationAsReadRepo(notificationId, recipientId);

  /**
   * 1. 알림이 존재하지 않거나
   * 2. 이미 읽었거나
   * 3. 본인 소유가 아닌 경우
   * 일괄 not found 처리 (보안/UX 관점에서 안전)
   */
  if (result.count === 0) throw ApiError.notFound('알림을 찾을 수 없거나 이미 처리되었거나 권한이 없습니다.');
};
