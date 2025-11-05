import { RequestHandler } from 'express';
import { apartmentRequestQuerySchema } from './dto/apartment.dto';

export const validateApartmentRequestQuery: RequestHandler = (req, res, next) => {
  try {
    const validatedQuery = apartmentRequestQuerySchema.parse(req.query);
    res.locals.validatedQuery = validatedQuery;
    next();
  } catch (err) {
    next(err);
  }
};
