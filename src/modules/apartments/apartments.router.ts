import { Router } from 'express';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import { validateApartmentRequestQuery } from './apartments.validator';
import { getApartmentHandler, getApartmentListHandler } from './apartments.controller';

const apartmentRouter = Router();

apartmentRouter
  .route('/')
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'SUPER_ADMIN', 'USER']),
    validateApartmentRequestQuery,
    getApartmentListHandler
  );

apartmentRouter.route('/:id').get(authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN', 'USER']), getApartmentHandler);
