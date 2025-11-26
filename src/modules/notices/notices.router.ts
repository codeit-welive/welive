import { Router } from 'express';
import { createNotice, deleteNotice, getNotice, getNoticeList, updateNotice } from './notices.controller';
import {
  validateNoticeCreate,
  validateNoticeParams,
  validateNoticeQuery,
  validateNoticeUpdate,
} from './notices.validator';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import sanitizeMiddleware from '#core/sanitize';

const noticeRouter = Router();

noticeRouter
  .route('/')
  .post(
    authMiddleware,
    requireRole(['ADMIN']),
    validateNoticeCreate,
    sanitizeMiddleware('notices'),
    //#swagger.tags = ['Notices']
    //#swagger.summary = '[공지] 공지사항 생성'
    //#swagger.description = '관리자(ADMIN)가 공지사항을 생성합니다. 제목, 내용, 카테고리, 고정 여부, 게시기간 등을 포함합니다.'
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { category: "MAINTENANCE", title: "승강기 정기점검에 따른 일시 운행 중단 안내", content: "매월 실시하는 승강기 정기점검 관계로 아래와 같이 각 승강기별로 일시 운행 중단", boardId: "board-uuid-1234", isPinned: false, startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-10T00:00:00Z" } } } }
    //#swagger.responses[201] = { description: '공지 생성 성공', content: { "application/json": { example: { message: "정상적으로 등록 처리되었습니다" } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (유효성 검증 실패)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    createNotice
  )
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateNoticeQuery,
    //#swagger.tags = ['Notices']
    //#swagger.summary = '[공지] 공지사항 목록 조회'
    //#swagger.description = '권한에 따라 공지사항 목록을 조회합니다. USER는 본인 아파트의 공지를 조회하고, ADMIN은 관리 아파트의 공지를 조회합니다. 검색, 카테고리, 페이지네이션을 지원합니다.'
    //#swagger.parameters['page'] = { in: 'query', description: '페이지 번호 (기본값: 1)', type: 'integer' }
    //#swagger.parameters['pageSize'] = { in: 'query', description: '페이지 크기 (기본값: 5)', type: 'integer' }
    //#swagger.parameters['category'] = { in: 'query', description: '공지 카테고리 필터', type: 'string', enum: ['MAINTENANCE','EMERGENCY','COMMUNITY','RESIDENT_VOTE','RESIDENT_COUNCIL','COMPLAINT','ETC'] }
    //#swagger.parameters['search'] = { in: 'query', description: '검색어 (제목/내용 포함)', type: 'string' }
    //#swagger.responses[200] = { description: '공지 목록 조회 성공', content: { "application/json": { example: { notices: [{ noticeId: "notice-uuid", userId: "user-uuid", category: "MAINTENANCE", title: "현관문 도어락이 고장났어요", writerName: "김세대", createdAt: "2025-06-04T08:30:00Z", updatedAt: "2025-06-08T08:30:00Z", viewsCount: 26, commentsCount: 3, isPinned: true }], totalCount: 42 } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (쿼리 오류)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음' }
    getNoticeList
  );

noticeRouter
  .route('/:noticeId')
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateNoticeParams,
    //#swagger.tags = ['Notices']
    //#swagger.summary = '[공지] 공지사항 상세 조회'
    //#swagger.description = '특정 공지사항의 상세 정보를 조회합니다. 카테고리, 제목, 작성자 정보, 댓글 목록 등이 함께 반환됩니다.'
    //#swagger.parameters['noticeId'] = { in: 'path', required: true, description: '공지사항 ID(UUID)', type: 'string' }
    //#swagger.responses[200] = { description: '공지 상세 조회 성공', content: { "application/json": { example: { noticeId: "notice-uuid", userId: "user-uuid", category: "MAINTENANCE", title: "현관문 도어락이 고장났어요", writerName: "김세대", createdAt: "2025-06-04T08:30:00Z", updatedAt: "2025-06-08T08:30:00Z", viewsCount: 26, commentsCount: 3, isPinned: true, content: "도어락 비밀번호가 눌러지지 않습니다. 빠른 수리 부탁드립니다.", boardName: "공지사항", comments: [{ id: "comment-uuid", userId: "user-uuid", content: "수정된 댓글 내용입니다.", createdAt: "2025-06-19T14:12:14.396Z", updatedAt: "2025-06-20T03:29:00.000Z", writerName: "워그레이몬" }] } } } }
    //#swagger.responses[400] = { description: '경로 파라미터 오류' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음' }
    //#swagger.responses[404] = { description: '공지사항을 찾을 수 없음' }
    getNotice
  )
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validateNoticeParams,
    validateNoticeUpdate,
    sanitizeMiddleware('notices'),
    //#swagger.tags = ['Notices']
    //#swagger.summary = '[공지] 공지사항 수정'
    //#swagger.description = '관리자(ADMIN)가 공지사항을 수정합니다. 제목, 내용, 카테고리, 게시판, 고정 여부, 게시기간 등을 수정할 수 있습니다.'
    //#swagger.parameters['noticeId'] = { in: 'path', required: true, description: '수정할 공지사항 ID(UUID)', type: 'string' }
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { category: "MAINTENANCE", title: "승강기 정기점검에 따른 일시 운행 중단 안내", content: "매월 실시하는 승강기 정기점검 관계로 각 승강기별로 일시 운행 중단", boardId: "board-uuid-1234", isPinned: false, startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-10T00:00:00Z", userId: "user-uuid" } } } }
    //#swagger.responses[200] = { description: '공지 수정 성공', content: { "application/json": { example: { noticeId: "notice-uuid", userId: "user-uuid", category: "MAINTENANCE", title: "현관문 도어락이 고장났어요", writerName: "김세대", createdAt: "2025-06-04T08:30:00Z", updatedAt: "2025-06-08T08:30:00Z", viewsCount: 26, commentsCount: 3, isPinned: true } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (유효성 검증 실패)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요 또는 작성자 불일치)' }
    //#swagger.responses[404] = { description: '공지사항을 찾을 수 없음' }
    updateNotice
  )
  .delete(
    authMiddleware,
    requireRole(['ADMIN']),
    //#swagger.tags = ['Notices']
    //#swagger.summary = '[공지] 공지사항 삭제'
    //#swagger.description = '관리자(ADMIN)가 공지사항을 삭제합니다.'
    //#swagger.parameters['noticeId'] = { in: 'path', required: true, description: '삭제할 공지사항 ID(UUID)', type: 'string' }
    //#swagger.responses[200] = { description: '공지 삭제 성공', content: { "application/json": { example: { message: "정상적으로 삭제 처리되었습니다" } } } }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    //#swagger.responses[404] = { description: '공지사항을 찾을 수 없음' }
    deleteNotice
  );

export default noticeRouter;
