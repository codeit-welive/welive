import { Router } from 'express';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import { validateApartmentRequestParams, validateApartmentRequestQuery } from './apartments.validator';
import { getApartmentHandler, getApartmentListHandler } from './apartments.controller';

const apartmentRouter = Router();

apartmentRouter.route('/public').get(validateApartmentRequestQuery, getApartmentListHandler);
apartmentRouter.route('/public/:id').get(validateApartmentRequestParams, getApartmentHandler);

apartmentRouter
  .route('/')
  .get(authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), validateApartmentRequestQuery, getApartmentListHandler);
apartmentRouter
  .route('/:id')
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'SUPER_ADMIN', 'USER']),
    validateApartmentRequestParams,
    getApartmentHandler
  );

export default apartmentRouter;
