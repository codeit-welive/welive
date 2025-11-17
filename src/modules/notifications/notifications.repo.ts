/**
 * @file modules/notifications/notifications.repo.ts
 * @description Notifications 관련 DB 접근 레이어
 */

import prisma from '#core/prisma';

/**
 * 단일 알림을 읽음 처리
 * - recipientId까지 where에 포함하여 권한 범위를 DB 레벨에서 제한
 * - 이미 isChecked=true인 경우에는 count=0으로 반환
 */
export const markNotificationAsReadRepo = async (notificationId: string, recipientId: string) =>
  prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId,
      isChecked: false,
    },
    data: {
      isChecked: true,
    },
  });
