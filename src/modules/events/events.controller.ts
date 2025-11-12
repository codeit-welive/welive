import { RequestHandler } from 'express';
import { getEventListService, updateCreateEventService } from './events.service';
import { eventListQueryInputDTO, eventUpdateQueryInputDTO } from './dto/events.dto';

export const getEventList: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventListQueryInputDTO;
  return await getEventListService(query);
};

export const createEvent: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventUpdateQueryInputDTO;
  await updateCreateEventService(query);
};

export const deleteEvent: RequestHandler = async (req, res, next) => {};
