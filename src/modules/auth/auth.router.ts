import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
  registSuperAdminHandler,
  registerAdminHandler,
  registerUserHandler,
} from './auth.controller';
import { validateSuperAdminCreate, validateAdminCreate, validateUserCreate, validateLogin } from './auth.validator';
import authMiddleware from '#core/middlewares/authMiddleware';

const authRouter = Router();

authRouter.route('/signup').post(validateUserCreate, registerUserHandler);
authRouter.route('/signup/admin').post(validateAdminCreate, registerAdminHandler);
authRouter.route('/signup/super-admin').post(validateSuperAdminCreate, registSuperAdminHandler);

authRouter.route('/login').post(validateLogin, loginHandler);
authRouter.route('/logout').post(authMiddleware, logoutHandler);
authRouter.route('/refresh').post(refreshTokenHandler);

export default authRouter;
