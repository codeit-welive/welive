import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { cancelVote, postVote } from './options.controller';
import { validateDeleteVoteParams, validatePostVoteParams } from './options.validator';

const optionRouter = express.Router();

optionRouter
  .route('/:optionId/vote')
  .post(authMiddleware, validatePostVoteParams, requireRole(['USER']), postVote)
  .delete(authMiddleware, validateDeleteVoteParams, requireRole(['USER']), cancelVote);

export default optionRouter;
