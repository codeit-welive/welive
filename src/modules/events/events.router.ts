import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { validateEventDeleteParams, validateEventListQuery, validateEventUpdateQuery } from './events.validator';
import { createEvent, deleteEvent, getEventList } from './events.controller';

const eventRouter = express.Router();

eventRouter
  .route('/')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateEventListQuery, getEventList)
  .put(authMiddleware, requireRole(['ADMIN']), validateEventUpdateQuery, createEvent);
eventRouter.route('/:eventId').delete(authMiddleware, requireRole(['ADMIN']), validateEventDeleteParams, deleteEvent);

export default eventRouter;
