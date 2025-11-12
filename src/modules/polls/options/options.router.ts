import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { cancelVote, postVote } from './options.controller';

const optionRouter = express.Router();

optionRouter
  .route('/:optionId/vote')
  .post(authMiddleware, requireRole(['USER']), postVote)
  .delete(authMiddleware, requireRole(['USER']), cancelVote);

export default optionRouter;
