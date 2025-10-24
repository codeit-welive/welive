import type { Request, Response, NextFunction } from 'express';
import {
  ComplaintCreateDto,
  ComplaintPatchDto,
  ComplaintPatchStatusDto,
  ComplaintDeleteDto,
} from './dto/complaints.dto';
import { ComplaintListQuery } from './dto/querys.dto';
import * as complaintService from './complaints.service';
import { RESPONSE_MESSAGES } from '#constants/response.constant';

export const createComplaintHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = res.locals.validatedBody as ComplaintCreateDto;
    await complaintService.createComplaint(data);
    res.status(201).json({ message: RESPONSE_MESSAGES.CREATE_SUCCESS });
  } catch (err) {
    next(err);
  }
};

export const getComplaintListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const query = res.locals.validatedQuery as ComplaintListQuery;
    const complaints = await complaintService.getComplaintList(userId, role, query);
    res.status(200).json(complaints);
  } catch (err) {
    next(err);
  }
};

export const getComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userId = req.user.id;
    const role = req.user.role;
    const complaint = await complaintService.getComplaint(complaintId, userId, role);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

export const patchComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userId = req.user.id;
    const data = res.locals.validatedBody as ComplaintPatchDto;
    const complaint = await complaintService.patchComplaint(complaintId, userId, data);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

export const patchComplaintStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const data = res.locals.validatedBody as ComplaintPatchStatusDto;
    const complaint = await complaintService.patchComplaintStatus(complaintId, data);
    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

export const deleteComplaintHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params.complaintId;
    const userData = res.locals.validatedBody as ComplaintDeleteDto;
    await complaintService.deleteComplaint(complaintId, userData);
    res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    next(err);
  }
};
