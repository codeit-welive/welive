import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { validateCreatePollBody, validatePatchPollBody, validatePollListQuery } from './polls.validator';
import { createPoll, deletePoll, getPoll, getPollList, patchPoll } from './polls.controller';

const pollRouter = express.Router();

pollRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN']), validateCreatePollBody, createPoll)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validatePollListQuery, getPollList);

pollRouter
  .route('/:pollId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), getPoll)
  .patch(authMiddleware, requireRole(['ADMIN']), validatePatchPollBody, patchPoll)
  .delete(authMiddleware, requireRole(['ADMIN']), deletePoll);

export default pollRouter;
