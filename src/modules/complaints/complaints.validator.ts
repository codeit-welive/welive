import type { Request, Response, NextFunction } from 'express';
import forwardZodError from '#utils/zod';
import { complaintCreateSchema, complaintPatchSchema } from './dto/complaints.dto';
import { complaintListQuerySchema } from './dto/querys.dto';
import { complaintParamsSchema } from './dto/params.dto';

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

export const validateComplaintParams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { complaintId } = req.params;
    await complaintParamsSchema.parseAsync(complaintId);
    next();
  } catch (err) {
    forwardZodError(err, '민원 상세 조회', next);
  }
};

export const validateComplaintPatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedBody = await complaintPatchSchema.parseAsync(req.body);

    res.locals.validatedBody = validatedBody;
    next();
  } catch (err) {
    forwardZodError(err, '민원 수정', next);
  }
};
