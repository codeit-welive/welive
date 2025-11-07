import { RequestHandler } from 'express';

const getEventList: RequestHandler = (req, res, next) => {
  const apartmentId = req.query.apartmentId;
  const year = Number(req.query.year);
  const month = Number(req.query.month);
};
