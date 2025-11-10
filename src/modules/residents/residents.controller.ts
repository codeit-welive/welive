import { RequestHandler } from 'express';
import { getResident, getResidentList } from './residents.service';

export const getResidentListHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;
    const adminId = req.user.id;
    const result = await getResidentList(query, adminId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const result = await getResident(residentId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
