import { Router } from 'express';
import { loginHandler, registSuperAdminHandler, registerAdminHandler, registerUserHandler } from './auth.controller';
import { validateSuperAdminCreate, validateAdminCreate, validateUserCreate, validateLogin } from './auth.validator';

const authRouter = Router();

authRouter.route('/signup').post(validateUserCreate, registerUserHandler);
authRouter.route('/signup/admin').post(validateAdminCreate, registerAdminHandler);
authRouter.route('/signup/super-admin').post(validateSuperAdminCreate, registSuperAdminHandler);

authRouter.route('/login').post(validateLogin, loginHandler);

export default authRouter;
