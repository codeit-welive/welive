import { BoardType, EventCategory, NoticeCategory, Prisma } from '@prisma/client';
import {
  deleteEventRepo,
  getEventListRepo,
  getMonthlyNoticeList,
  getMonthlyPollList,
  getNoticeDataByBoardId,
  getPollDataByBoardId,
  upsertEventByNoticeId,
  upsertEventByPollId,
  findEventByIdRepo,
} from './events.repo';
import { eventListQueryInputDTO, eventUpdateQueryInputDTO } from './dto/events.dto';
import { getBoardTypeRepo } from '#modules/notices/notices.repo';
import ApiError from '#errors/ApiError';
import prisma from '#core/prisma';

export const syncEventsForMonthService = async (query: eventListQueryInputDTO) => {
  const year = Number(query.year);
  const month = Number(query.month);
  const apartmentId = query.apartmentId;

  // 해당 월의 시작/끝 (로컬 기준 그대로 사용)
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // 1) 이 달과 겹치는 공지(Notice) 조회
  const notices = await getMonthlyNoticeList(apartmentId, startOfMonth, endOfMonth);

  // 2) 이 달과 겹치는 투표(Poll) 조회
  const polls = await getMonthlyPollList(apartmentId, startOfMonth, endOfMonth);

  // 3) Notice → Event upsert
  for (const n of notices) {
    if (!n.startDate || !n.endDate || !n.apartmentId) continue;

    const eventCategory = mapNoticeToEventCategory(n.category);

    await upsertEventByNoticeId(n.id, BoardType.NOTICE, eventCategory, n.title, n.apartmentId, n.startDate, n.endDate);
  }

  // 4) Poll → Event upsert
  for (const p of polls) {
    if (!p.startDate || !p.endDate || !p.apartmentId) continue;

    await upsertEventByPollId(
      p.id,
      BoardType.POLL,
      EventCategory.RESIDENT_VOTE, // Poll은 일정 카테고리를 투표로 고정
      p.title,
      p.apartmentId,
      p.startDate,
      p.endDate
    );
  }
};

export const getEventListService = async (query: eventListQueryInputDTO) => {
  const startOfMonth = new Date(Number(query.year), Number(query.month) - 1, 1); // 1일 00:00
  const endOfMonth = new Date(Number(query.year), Number(query.month), 0, 23, 59, 59, 999); // 말일 23:59
  const apartmentId = query.apartmentId;
  const where: Prisma.EventWhereInput = {
    apartmentId,
    AND: [{ startDate: { lte: endOfMonth } }, { endDate: { gte: startOfMonth } }],
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
    await prisma.$transaction(async (tx) => {
      const data = await getNoticeDataByBoardId(tx, boardId);
      if (!data || !data.apartmentId) {
        throw ApiError.notFound();
      }
      if (!data.startDate || !data.endDate) {
        throw ApiError.unprocessable('기간 설정이 필요합니다.');
      }
      const { title, apartmentId, startDate, endDate } = data;
      const category = mapNoticeToEventCategory(data.category);
      await upsertEventByNoticeId(boardId, boardType.type, category, title, apartmentId, startDate, endDate, tx);
    });
  } else if (boardType?.type === BoardType.POLL) {
    await prisma.$transaction(async (tx) => {
      const data = await getPollDataByBoardId(tx, boardId);
      if (!data || !data.apartmentId) {
        throw ApiError.notFound();
      }
      if (!data.startDate || !data.endDate) {
        throw ApiError.unprocessable('기간 설정이 필요합니다.');
      }
      const { title, apartmentId, startDate, endDate } = data;
      const category = EventCategory.RESIDENT_VOTE;
      await upsertEventByPollId(boardId, boardType.type, category, title, apartmentId, startDate, endDate, tx);
    });
  }
};

export const deleteEventService = async (eventId: string) => {
  const exists = await findEventByIdRepo(eventId);
  if (!exists) {
    throw ApiError.notFound('이벤트를 찾을 수 없습니다.');
  }

  return deleteEventRepo(eventId);
};
