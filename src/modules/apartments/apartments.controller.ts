import { RequestHandler } from 'express';
import { getApartment, getApartmentList } from './apartments.service';

export const getApartmentListHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;
    const userRole = req.user.role;

    const apartments = await getApartmentList(query, userRole);
    return res.status(200).json(apartments);
  } catch (err) {
    next(err);
  }
};

export const getApartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const apartmentId = req.params.id;
    const userRole = req.user.role;

    const apartment = await getApartment(apartmentId, userRole);
    return res.status(200).json(apartment);
  } catch (err) {
    next(err);
  }
};
