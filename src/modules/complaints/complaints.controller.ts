import type { Request, Response, NextFunction } from 'express';
import { ComplaintCreateDto } from './dto/complaints.dto';
import { ComplaintListQuery } from './dto/query.dto';
import * as complaintService from './complaints.service';

export const createComplaintHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as ComplaintCreateDto;
    await complaintService.createComplaint(data);
    res.status(201).json({ message: '정상적으로 등록 처리되었습니다.' });
  } catch (err) {
    next(err);
  }
};

export const getComplaintListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const query = res.locals.validatedQuery as ComplaintListQuery;
    const result = await complaintService.getComplaintList(userId, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
