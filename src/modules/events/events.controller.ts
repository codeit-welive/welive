import { RequestHandler } from 'express';
import { deleteEventService, getEventListService, updateCreateEventService } from './events.service';
import { eventDeleteParamsInputDTO, eventListQueryInputDTO, eventUpdateQueryInputDTO } from './dto/events.dto';

export const getEventList: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventListQueryInputDTO;
  await getEventListService(query);
  res.status(200);
};

export const createEvent: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventUpdateQueryInputDTO;
  await updateCreateEventService(query);
  res.status(204);
};

export const deleteEvent: RequestHandler = async (req, res, next) => {
  const params = res.locals.params as eventDeleteParamsInputDTO;
  const eventId = params.eventId;
  const deltedEvent = await deleteEventService(eventId);
  res.status(200).json(deltedEvent);
};
