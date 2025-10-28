import { Router } from 'express';
import { registSuperAdminHandler, registerAdminHandler, registerUserHandler } from './auth.controller';
import { validateSuperAdminCreate, validateAdminCreate, validateUserCreate } from './auth.validator';

const authRouter = Router();

authRouter.route('/signup').post(validateUserCreate, registerUserHandler);
authRouter.route('/signup/admin').post(validateAdminCreate, registerAdminHandler);
authRouter.route('/signup/super-admin').post(validateSuperAdminCreate, registSuperAdminHandler);

export default authRouter;
