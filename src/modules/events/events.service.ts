import { BoardType, EventCategory, NoticeCategory, Prisma } from '@prisma/client';
import {
  deleteEventRepo,
  getEventListRepo,
  getNoticeDataByBoardId,
  getPollDataByBoardId,
  upsertEventByNoticeId,
  upsertEventByPollId,
} from './events.repo';
import { eventListQueryInputDTO, eventUpdateQueryInputDTO } from './dto/events.dto';
import { getBoardTypeRepo } from '#modules/notices/notices.repo';
import ApiError from '#errors/ApiError';
import prisma from '#core/prisma';

export const getEventListService = async (query: eventListQueryInputDTO) => {
  const startOfMonth = new Date(query.year, query.month - 1, 1); // 1일 00:00
  const endOfMonth = new Date(query.year, query.month, 0, 23, 59, 59, 999); // 말일 23:59
  const apartmentId = query.apartmentId;
  const where: Prisma.EventWhereInput = {
    apartmentId,
    startDate: { lte: startOfMonth },
    endDate: { gte: endOfMonth },
  };
  const rawEvents = await getEventListRepo(where);
  return rawEvents.map((e) => ({
    id: e.id,
    start: e.startDate,
    end: e.endDate,
    title: e.title,
    category: e.category,
    type: e.boardType,
  }));
};

const mapNoticeToEventCategory = (nc: NoticeCategory): EventCategory => {
  switch (nc) {
    case NoticeCategory.MAINTENANCE:
    case NoticeCategory.RESIDENT_VOTE:
    case NoticeCategory.COMPLAINT:
      // 이름이 동일한 것만 그대로 사용
      return nc as unknown as EventCategory;
    default:
      return EventCategory.GENERAL;
  }
};

export const updateCreateEventService = async (query: eventUpdateQueryInputDTO) => {
  const boardId = query.boardId;
  const boardType = await getBoardTypeRepo(boardId);
  if (!boardType) {
    throw ApiError.notFound();
  }
  if (boardType.type === BoardType.NOTICE) {
    prisma.$transaction(async (tx) => {
      const data = await getNoticeDataByBoardId(boardId);
      if (!data || !data.apartmentId) {
        throw ApiError.notFound();
      }
      if (!data.startDate || !data.endDate) {
        throw ApiError.unprocessable('기간 설정이 필요합니다.');
      }
      const { title, apartmentId, startDate, endDate } = data;
      const category = await mapNoticeToEventCategory(data.category);
      await upsertEventByNoticeId(boardId, boardType.type, category, title, apartmentId, startDate, endDate);
    });
  } else if (boardType?.type === BoardType.POLL) {
    prisma.$transaction(async (tx) => {
      const data = await getPollDataByBoardId(boardId);
      if (!data || !data.apartmentId) {
        throw ApiError.notFound();
      }
      if (!data.startDate || !data.endDate) {
        throw ApiError.unprocessable('기간 설정이 필요합니다.');
      }
      const { title, apartmentId, startDate, endDate } = data;
      const category = EventCategory.RESIDENT_VOTE;
      await upsertEventByPollId(boardId, boardType.type, category, title, apartmentId, startDate, endDate);
    });
  }
};

export const deleteEventService = async (eventId: string) => {
  return deleteEventRepo(eventId);
};
