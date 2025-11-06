import { Router } from 'express';

/**
 * 시스템 레벨 (core, infra)
 */
import healthRouter from '#core/health/health.router';
import sseRouter from '#sse/index';

/**
 * 도메인 레벨 (modules)
 */
import authRouter from '#modules/auth/auth.router';
import commentRouter from '#modules/comments/comments.router';
import complaintRouter from '#modules/complaints/complaints.router';
import noticeRouter from '#modules/notices/notices.router';
import pollSchedulerRouter from '#modules/poll-scheduler/poll-scheduler.router';
import residentsRouter from '#modules/residents/residents.router';
import usersRouter from '#modules/users/users.router';
import pollRouter from '#modules/polls/polls.router';
import optionRouter from '#modules/polls/options/options.router';

const router = Router();

/**
 * 시스템 계층 라우트
 */
router.use('/', healthRouter);
router.use('/notifications', sseRouter);

/**
 * 도메인 계층 라우트
 */
router.use('/auth', authRouter);
router.use('/comments', commentRouter);
router.use('/complaints', complaintRouter);
router.use('/notices', noticeRouter);
router.use('/poll-scheduler', pollSchedulerRouter);
router.use('/residents', residentsRouter);
router.use('/users', usersRouter);
router.use('/polls', pollRouter);
router.use('/options', optionRouter);

export default router;
