import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { validateCreatePollBody, validatePatchPollBody } from './polls.validator';
import { createPoll, getPoll, getPollList } from './polls.controller';

const poleRouter = express.Router();

poleRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN']), validateCreatePollBody, createPoll)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), getPollList);

poleRouter
  .route('/:pollId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), getPoll)
  .patch(authMiddleware, requireRole(['ADMIN']), validatePatchPollBody)
  .delete(authMiddleware, requireRole(['ADMIN']));

export default poleRouter;
