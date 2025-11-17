/**
 * @file modules/notifications/notifications.controller.ts
 * @description Notification 컨트롤러
 */

import type { RequestHandler } from 'express';
import ApiError from '#errors/ApiError';
import { logger } from '#core/logger';
import { markNotificationAsReadService } from './notifications.service';

/**
 * @description 단일 알림 읽음 처리 컨트롤러
 */
export const markNotificationAsReadController: RequestHandler = async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  if (!notificationId) return next(ApiError.badRequest('알림 ID가 필요합니다.'));

  try {
    await markNotificationAsReadService(notificationId, userId);
    logger.notifications.info(`알림 읽음 처리 완료 (notificationId=${notificationId}, userId=${userId})`);

    return res.status(200).json({
      message: '알림을 읽음 처리했습니다.',
      notificationId,
    });
  } catch (err) {
    logger.notifications.warn(`알림 읽음 처리 실패 (notificationId=${notificationId}, userId=${userId})`);
    return next(err);
  }
};
