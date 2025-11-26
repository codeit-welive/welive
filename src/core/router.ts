/**
 * @file #core/router/index.ts
 * @description 전체 API 라우트 엔트리 포인트
 *
 * @routing-architecture
 * - 시스템 계층(Core/Infra: health, SSE, WebSocket)을 최상단에 배치
 * - 이후 도메인 계층을 '도메인 의존 순서' 기반으로 정렬
 *   1) Auth → Users → Residents → Apartments
 *   2) Notices → Complaints → Comments
 *   3) Polls → Options → Poll-Scheduler
 *   4) Events
 *   5) Notifications(REST)
 *
 * @notes
 * - 새로운 도메인은 반드시 '의존 순서'에 따라 올바른 섹션에 추가할 것
 * - 시스템 프로토콜(SSE/WS)은 도메인 계층에 섞지 말 것
 */

import { Router } from 'express';
const router = Router();

/**
 * ================================
 * 0. 시스템 계층 (infra / core)
 * ================================
 */
import healthRouter from '#core/health/health.router';
import sseRouter from '#sse/index';
import chatRouter from '#modules/chats/chats.router';

router.use('/', healthRouter);
router.use('/notifications/sse', sseRouter); // SSE
router.use('/chats', chatRouter); // Websocket entry

/**
 * ================================
 * 1. 인증 · 계정 계층
 * (Auth → Users → Residents → Apartments)
 * ================================
 */
import authRouter from '#modules/auth/auth.router';
import usersRouter from '#modules/users/users.router';
import residentsRouter from '#modules/residents/residents.router';
import apartmentRouter from '#modules/apartments/apartments.router';

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/residents', residentsRouter);
router.use('/apartments', apartmentRouter);

/**
 * ================================
 * 2. 게시판 계층
 * (Notices → Complaints → Comments)
 * ================================
 */
import noticeRouter from '#modules/notices/notices.router';
import complaintRouter from '#modules/complaints/complaints.router';
import commentRouter from '#modules/comments/comments.router';

router.use('/notices', noticeRouter);
router.use('/complaints', complaintRouter);
router.use('/comments', commentRouter);

/**
 * ================================
 * 3. 투표 계층
 * (Polls → Options → Scheduler)
 * ================================
 */
import pollRouter from '#modules/polls/polls.router';
import optionRouter from '#modules/polls/options/options.router';
import pollSchedulerRouter from '#modules/poll-scheduler/poll-scheduler.router';

router.use('/polls', pollRouter);
router.use('/options', optionRouter);
router.use('/poll-scheduler', pollSchedulerRouter);

/**
 * ================================
 * 4. 이벤트 계층
 * ================================
 */
import eventRouter from '#modules/events/events.router';
router.use('/event', eventRouter);

/**
 * ================================
 * 5. 알림 계층 (REST)
 * ================================
 */
import notificationsRouter from '#modules/notifications/notifications.router';
router.use('/notifications', notificationsRouter);

export default router;
