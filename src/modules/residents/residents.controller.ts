import { RequestHandler } from 'express';
import { getResident, getResidentList, patchResident, removeResident } from './residents.service';

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

export const patchResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const data = res.locals.validatedBody;
    const result = await patchResident(residentId, data);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    await removeResident(residentId);

    res.status(204).send({ message: '작업이 성공적으로 완료되었습니다' });
  } catch (err) {
    next(err);
  }
};
