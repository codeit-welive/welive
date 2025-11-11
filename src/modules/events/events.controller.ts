import { RequestHandler } from 'express';

export const getEventList: RequestHandler = async (req, res, next) => {
  const apartmentId = req.query.apartmentId;
  const year = req.query.year;
  const month = req.query.month;
  const events = await 
};
