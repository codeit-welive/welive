import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';

const poleRouter = express.Router();

poleRouter
  .route('/:optionId/vote')
  .post(authMiddleware, requireRole(['ADMIN']))
  .delete(authMiddleware, requireRole(['ADMIN']));

export default poleRouter;
