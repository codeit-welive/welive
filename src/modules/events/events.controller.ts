import { RequestHandler } from 'express';
import {
  deleteEventService,
  getEventListService,
  syncEventsForMonthService,
  updateCreateEventService,
} from './events.service';
import { eventDeleteParamsInputDTO, eventListQueryInputDTO, eventUpdateQueryInputDTO } from './dto/events.dto';

export const getEventList: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventListQueryInputDTO;
  await syncEventsForMonthService(query);
  const events = await getEventListService(query);
  return res.status(200).json(events);
};

export const createEvent: RequestHandler = async (req, res, next) => {
  const query = res.locals.query as eventUpdateQueryInputDTO;
  await updateCreateEventService(query);
  return res.sendStatus(204);
};

export const deleteEvent: RequestHandler = async (req, res, next) => {
  const params = res.locals.params as eventDeleteParamsInputDTO;
  const eventId = params.eventId;
  const deletedEvent = await deleteEventService(eventId);
  return res.status(200).json(deletedEvent);
};
