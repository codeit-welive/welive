import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { validateEventDeleteParams, validateEventListQuery, validateEventUpdateQuery } from './events.validator';
import { createEvent, deleteEvent, getEventList } from './events.controller';

const eventRouter = express.Router();

eventRouter
  .route('/')
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateEventListQuery,
    //#swagger.tags = ['Events']
    //#swagger.summary = '이벤트 목록 조회'
    //#swagger.description = '조회 연도(year)와 월(month)을 기준으로 아파트(apartmentId)의 Notice/Poll 기반 이벤트 목록을 조회합니다.'
    //#swagger.parameters['apartmentId'] = { in: 'query', type: 'string', required: true, description: '아파트 ID(UUID)' }
    //#swagger.parameters['year'] = { in: 'query', type: 'number', required: true, description: '조회 연도' }
    //#swagger.parameters['month'] = { in: 'query', type: 'number', required: true, description: '조회 월(1~12)' }
    //#swagger.responses[200] = { description: '이벤트 목록 조회 성공', content: { "application/json": { example: [{ id: "eventsId", start: "2025-06-13T00:00:00.000Z", end: "2025-06-15T23:59:59.999Z", title: "입주민 총회 안내", category: "GENERAL", type: "NOTICE" }] } } }
    getEventList
  )
  .put(
    authMiddleware,
    requireRole(['ADMIN']),
    validateEventUpdateQuery,
    //#swagger.tags = ['Events']
    //#swagger.summary = '이벤트 생성/업데이트'
    //#swagger.description = '게시글(NOTICE 또는 POLL)의 boardId와 기간(startDate, endDate)을 기반으로 이벤트를 생성하거나 갱신합니다.'
    //#swagger.parameters['boardType'] = { in: 'query', type: 'string', required: true, description: '게시물 타입(NOTICE 또는 POLL)' }
    //#swagger.parameters['boardId'] = { in: 'query', type: 'string', required: true, description: '게시글 ID(UUID)' }
    //#swagger.parameters['startDate'] = { in: 'query', type: 'string', required: true, description: '이벤트 시작일(ISO 날짜)' }
    //#swagger.parameters['endDate'] = { in: 'query', type: 'string', required: true, description: '이벤트 종료일(ISO 날짜)' }
    //#swagger.responses[204] = { description: '이벤트 생성/업데이트 성공' }
    createEvent
  );

eventRouter.route('/:eventId').delete(
  authMiddleware,
  requireRole(['ADMIN']),
  validateEventDeleteParams,
  //#swagger.tags = ['Events']
  //#swagger.summary = '이벤트 삭제'
  //#swagger.description = '이벤트 ID(eventId)를 사용하여 단일 이벤트를 삭제합니다.'
  //#swagger.parameters['eventId'] = { in: 'path', type: 'string', required: true, description: '이벤트 ID(UUID)' }
  //#swagger.responses[200] = { description: '이벤트 삭제 성공', content: { "application/json": { example: { id: "eventsId", startDate: "2025-06-13T00:00:00.000Z", endDate: "2025-06-15T23:59:59.999Z", boardType: "NOTICE", noticeId: "01975d4f-f44c-7f82-b765-eb294c888fed", pollId: null } } } }
  deleteEvent
);

export default eventRouter;
