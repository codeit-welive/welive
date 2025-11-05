import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  patchAdminStatusHandler,
  patchUserStatusHandler,
  refreshTokenHandler,
  registSuperAdminHandler,
  registerAdminHandler,
  registerUserHandler,
} from './auth.controller';
import {
  validateSuperAdminCreate,
  validateAdminCreate,
  validateUserCreate,
  validateLogin,
  validatePatchStatusBody,
  validatePatchStatusParam,
} from './auth.validator';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';

const authRouter = Router();

authRouter.route('/signup').post(validateUserCreate, registerUserHandler);
authRouter.route('/signup/admin').post(validateAdminCreate, registerAdminHandler);
authRouter.route('/signup/super-admin').post(validateSuperAdminCreate, registSuperAdminHandler);

authRouter.route('/login').post(validateLogin, loginHandler);
authRouter.route('/logout').post(authMiddleware, logoutHandler);
authRouter.route('/refresh').post(refreshTokenHandler);

authRouter
  .route('/admins/:adminId/status')
  .patch(
    authMiddleware,
    requireRole(['SUPER_ADMIN']),
    validatePatchStatusParam,
    validatePatchStatusBody,
    patchAdminStatusHandler
  );
authRouter
  .route('/admins/status')
  .patch(authMiddleware, requireRole(['SUPER_ADMIN']), validatePatchStatusBody, patchAdminStatusHandler);

authRouter
  .route('/residents/:residentId/status')
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validatePatchStatusParam,
    validatePatchStatusBody,
    patchUserStatusHandler
  );
authRouter
  .route('/residents/status')
  .patch(authMiddleware, requireRole(['ADMIN']), validatePatchStatusBody, patchUserStatusHandler);

authRouter.route('/cleanup').post(authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']));

export default authRouter;
