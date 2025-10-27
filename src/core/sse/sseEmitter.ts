/**
 * @file core/sse/sseEmitter.ts
 * @description 백그라운드 작업(Cron 등)에서 SSE 알림을 안전하게 전송하기 위한 브리지
 *
 * - Express 라우터에 직접 접근하지 않음
 * - broadcast() 호출만 간접 수행
 * - 연결 클라이언트가 없거나 오류 발생 시 시스템 경고 로그 출력
 */

import * as SSE from './index';
import type { NotificationPayload } from './types';
import { logger } from '#core/logger';

/**
 * 전체 클라이언트에 알림 전송
 * - Poll 만료, 공지 등록 등 전역 이벤트에서 사용
 */
export const sendSseNotification = (payload: NotificationPayload): void => {
  if (typeof SSE.broadcast !== 'function') {
    logger.sse.warn('SSE 라우터가 초기화되지 않아 전송을 건너뜁니다.');
    return;
  }

  try {
    SSE.broadcast(payload);
    logger.sse.debug('SSE broadcast 전송 성공');
  } catch (error) {
    logger.sse.warn(`SSE broadcast 실패: ${(error as Error).message}`);
  }
};

/**
 * 특정 유저에게 알림 전송
 * - 민원 처리 완료, 투표 결과 등 사용자별 이벤트에서 사용
 */
export const sendSseToUser = (userId: string, payload: NotificationPayload): void => {
  if (typeof SSE.sendToUser !== 'function') {
    logger.sse.warn(`SSE 라우터가 초기화되지 않아 개별 전송을 건너뜁니다. (userId=${userId})`);
    return;
  }

  try {
    SSE.sendToUser(userId, payload);
    logger.sse.debug(`SSE 개별 전송 성공 (userId=${userId})`);
  } catch (error) {
    logger.sse.warn(`SSE 개별 전송 실패 (userId=${userId}): ${(error as Error).message}`);
  }
};
