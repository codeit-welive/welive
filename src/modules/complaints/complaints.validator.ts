import type { Request, Response, NextFunction } from 'express';
import forwardZodError from '#utils/zod';
import { complaintCreateSchema } from './dto/complaints.dto';
import { complaintListQuerySchema } from './dto/query.dto';

export const validateComplaintCreate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedBody = await complaintCreateSchema.parseAsync({
      userId: req.user.id,
      ...req.body,
    });

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '민원 생성', next);
  }
};

export const validateComplaintListQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = await complaintListQuerySchema.parseAsync(req.query);

    res.locals.validatedQuery = validatedQuery;
    next();
  } catch (err) {
    forwardZodError(err, '민원 목록 조회', next);
  }
};
