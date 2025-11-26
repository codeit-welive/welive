import { Router } from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import sanitizeMiddleware from '#core/sanitize';
import { validateCreatePollBody, validatePatchPollBody, validatePollListQuery } from './polls.validator';
import { createPoll, deletePoll, getPoll, getPollList, patchPoll } from './polls.controller';

const pollRouter = Router();

pollRouter
  .route('/')
  .post(
    authMiddleware,
    requireRole(['ADMIN']),
    validateCreatePollBody,
    sanitizeMiddleware('polls'),
    //#swagger.tags = ['Polls']
    //#swagger.summary = '[투표] 투표 생성'
    //#swagger.description = '관리자(ADMIN)가 새로운 투표를 생성합니다. 투표 제목, 내용, 기간, 투표권자(buildingPermission), 옵션 목록 등을 포함합니다.'
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { boardId: "board-uuid-1234", status: "IN_PROGRESS", title: "제 3기 동대표 선출", content: "동대표를 선출합니다. 투표에 참여해주세요", buildingPermission: 0, startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-10T00:00:00Z", options: [{ title: "101호" }, { title: "404호" }, { title: "504호" }] } } } }
    //#swagger.responses[201] = { description: '투표 생성 성공', content: { "application/json": { example: { message: "정상적으로 등록 처리되었습니다" } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    createPoll
  )
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validatePollListQuery,
    //#swagger.tags = ['Polls']
    //#swagger.summary = '[투표] 투표 목록 조회'
    //#swagger.description = '권한에 따라 투표 목록을 조회합니다. USER는 본인 아파트의 투표만 조회하며, ADMIN은 관리 아파트의 투표 전체를 조회합니다. 페이지네이션 및 검색을 지원합니다.'
    //#swagger.parameters['page'] = { in: 'query', description: '페이지 번호 (기본값: 1)', type: 'integer' }
    //#swagger.parameters['limit'] = { in: 'query', description: '페이지 크기 (기본값: 10)', type: 'integer' }
    //#swagger.parameters['buildingPermission'] = { in: 'query', description: '투표권자 필터링 (0, 1, 2 등)', type: 'integer' }
    //#swagger.parameters['status'] = { in: 'query', description: '투표 상태 (PENDING, IN_PROGRESS, CLOSED)', type: 'string' }
    //#swagger.parameters['keyword'] = { in: 'query', description: '제목/내용 검색', type: 'string' }
    //#swagger.responses[200] = { description: '투표 목록 조회 성공', content: { "application/json": { example: { polls: [{ pollId: "poll-uuid", userId: "user-uuid", title: "제 104기 동대표 선출", writerName: "강관리자", buildingPermission: 0, createdAt: "2024-01-20T20:00:00Z", updatedAt: "2025-06-08T08:30:00Z", startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-10T00:00:00Z", status: "PENDING" }], totalCount: 42 } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (쿼리 검증 실패)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 또는 USER 역할 필요)' }
    getPollList
  );

pollRouter
  .route('/:pollId')
  .get(
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    //#swagger.tags = ['Polls']
    //#swagger.summary = '[투표] 투표 상세 조회'
    //#swagger.description = '특정 투표의 상세 정보를 조회합니다. USER는 본인 아파트의 투표만 조회할 수 있으며 ADMIN은 관리 아파트의 투표 전체를 조회할 수 있습니다.'
    //#swagger.parameters['pollId'] = { in: 'path', required: true, description: '조회할 투표 ID(UUID)', type: 'string' }
    //#swagger.responses[200] = { description: '투표 상세 조회 성공', content: { "application/json": { example: { pollId: "poll-uuid", userId: "user-uuid", title: "제 104기 동대표 선출", writerName: "강관리자", buildingPermission: 0, createdAt: "2024-01-20T20:00:00Z", updatedAt: "2025-06-08T08:30:00Z", startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-10T00:00:00Z", status: "PENDING", content: "동 대표를 선출합니다. 투표 참여해주세요.", boardName: "주민투표", options: [{ id: "optionId(uuid)", title: "1번 후보", voteCount: 42 }] } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (ID 형식 오류)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음' }
    //#swagger.responses[404] = { description: '투표를 찾을 수 없음' }
    getPoll
  )
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validatePatchPollBody,
    sanitizeMiddleware('polls'),
    //#swagger.tags = ['Polls']
    //#swagger.summary = '[투표] 투표 수정'
    //#swagger.description = '관리자(ADMIN)가 투표를 수정합니다. 제목, 내용, 옵션, 투표 기간, 상태 등을 수정할 수 있습니다.'
    //#swagger.parameters['pollId'] = { in: 'path', required: true, description: '수정할 투표의 ID(UUID)', type: 'string' }
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { title: "제 2회 돌려돌려 돌림판", content: "관리비 몰빵 묻고 더블로 갑니다.", buildingPermission: 0, startDate: "2025-06-11T12:00:00.000Z", endDate: "2025-06-12T20:00:00.000Z", status: "PENDING", options: [{ title: "1번 후보: 나는 아니길" }] } } } }
    //#swagger.responses[200] = { description: '투표 수정 성공' }
    //#swagger.responses[400] = { description: '잘못된 요청 (유효성 검증 실패)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    //#swagger.responses[404] = { description: '투표를 찾을 수 없음' }
    patchPoll
  )
  .delete(
    authMiddleware,
    requireRole(['ADMIN']),
    //#swagger.tags = ['Polls']
    //#swagger.summary = '[투표] 투표 삭제'
    //#swagger.description = '관리자(ADMIN)가 투표를 삭제합니다.'
    //#swagger.parameters['pollId'] = { in: 'path', required: true, description: '삭제할 투표 ID(UUID)', type: 'string' }
    //#swagger.responses[200] = { description: '투표 삭제 성공' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    //#swagger.responses[404] = { description: '투표를 찾을 수 없음' }
    deletePoll
  );

export default pollRouter;
