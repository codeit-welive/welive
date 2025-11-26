import { Router } from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import sanitizeMiddleware from '#core/sanitize';
import { validateCreatePollBody, validatePatchPollBody, validatePollListQuery } from './polls.validator';
import { createPoll, deletePoll, getPoll, getPollList, patchPoll } from './polls.controller';

const pollRouter = Router();

pollRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN']), validateCreatePollBody, sanitizeMiddleware('polls'), createPoll)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validatePollListQuery, getPollList);

pollRouter
  .route('/:pollId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), getPoll)
  .patch(authMiddleware, requireRole(['ADMIN']), validatePatchPollBody, sanitizeMiddleware('polls'), patchPoll)
  .delete(authMiddleware, requireRole(['ADMIN']), deletePoll);

export default pollRouter;
