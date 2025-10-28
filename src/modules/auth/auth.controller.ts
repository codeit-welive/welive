import { RequestHandler } from 'express';
import { registSuperAdmin, registAdmin, registUser } from './auth.service';

export const registSuperAdminHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registSuperAdmin(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const registerAdminHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registAdmin(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const registerUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registUser(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
