import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import sanitizeMiddleware from '#core/sanitize';
import {
  validateComplaintCreate,
  validateComplaintListQuery,
  validateComplaintParams,
  validateComplaintPatch,
  validateComplaintPatchStatus,
  validateComplaintDelete,
} from './complaints.validator';
import {
  createComplaintHandler,
  getComplaintListHandler,
  getComplaintHandler,
  patchComplaintHandler,
  patchComplaintStatusHandler,
  deleteComplaintHandler,
} from './complaints.controller';

const complaintRouter = Router();

/**
 * POST /complaints
 * 민원 생성 (USER만 가능)
 */
complaintRouter.route('/').post(
  authMiddleware,
  requireRole(['USER']),
  validateComplaintCreate,
  sanitizeMiddleware('complaints'),
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 생성'
  //#swagger.description = '입주민(USER)이 새로운 민원을 생성합니다. 본인이 속한 아파트의 게시판에만 민원을 작성할 수 있습니다. <br><br>**Request Body:**<br>- title (string, 필수): 민원 제목 (2-100자)<br>- content (string, 필수): 민원 내용 (10-2000자)<br>- isPublic (boolean, 선택): 공개 여부 (기본값: false)<br>- boardId (string, 필수): 게시판 ID (UUID)'
  //#swagger.requestBody = { required: true, content: { "application/json": { example: { title: "엘리베이터 고장", content: "엘리베이터가 자주 고장나서 불편합니다. 점검 부탁드립니다.", isPublic: false, boardId: "board-uuid-1234" } } } }
  //#swagger.responses[201] = { description: '민원 생성 성공', content: { "application/json": { example: { message: '정상적으로 등록 처리되었습니다.' } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패 등)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (USER 역할 필요, 또는 다른 아파트 게시판 접근 시도)' }
  createComplaintHandler
);

/**
 * GET /complaints
 * 민원 목록 조회 (ADMIN, USER)
 */
complaintRouter.route('/').get(
  authMiddleware,
  requireRole(['ADMIN', 'USER']),
  validateComplaintListQuery,
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 목록 조회'
  //#swagger.description = '권한에 따라 민원 목록을 조회합니다. USER는 본인이 속한 아파트의 공개 민원 + 본인 작성 민원을 조회하고, ADMIN은 관리 아파트의 모든 민원을 조회합니다. 페이지네이션 및 필터링을 지원합니다.'
  //#swagger.parameters['page'] = { in: 'query', description: '페이지 번호 (기본값: 1)', type: 'integer' }
  //#swagger.parameters['limit'] = { in: 'query', description: '페이지당 항목 수 (기본값: 10, 최대: 100)', type: 'integer' }
  //#swagger.parameters['status'] = { in: 'query', description: '민원 상태 필터 (PENDING, IN_PROGRESS, RESOLVED, REJECTED)', type: 'string' }
  //#swagger.parameters['isPublic'] = { in: 'query', description: '공개 여부 필터', type: 'boolean' }
  //#swagger.parameters['dong'] = { in: 'query', description: '동 번호 필터', type: 'string' }
  //#swagger.parameters['ho'] = { in: 'query', description: '호수 필터', type: 'string' }
  //#swagger.parameters['keyword'] = { in: 'query', description: '제목 검색 키워드', type: 'string' }
  //#swagger.responses[200] = { description: '민원 목록 조회 성공', content: { "application/json": { example: { complaints: [{ complaintId: "uuid-1234", userId: "user-uuid-5678", title: "엘리베이터 고장", writerName: "홍길동", createdAt: "2025-06-13T10:00:00.000Z", updatedAt: "2025-06-13T15:30:00.000Z", isPublic: true, viewsCount: 42, commentsCount: 3, status: "IN_PROGRESS", dong: "101", ho: "502" }], totalCount: 1 } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (유효하지 않은 쿼리 파라미터)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (ADMIN 또는 USER 역할 필요)' }
  getComplaintListHandler
);

/**
 * GET /complaints/:complaintId
 * 민원 상세 조회 (ADMIN, USER)
 */
complaintRouter.route('/:complaintId').get(
  authMiddleware,
  requireRole(['ADMIN', 'USER']),
  validateComplaintParams,
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 상세 조회'
  //#swagger.description = '민원 상세 정보를 조회합니다. USER는 본인이 작성한 민원 또는 공개된 민원만 조회 가능하고, ADMIN은 관리 아파트의 모든 민원을 조회할 수 있습니다. 댓글 목록도 함께 반환됩니다.'
  //#swagger.parameters['complaintId'] = { in: 'path', description: '조회할 민원의 UUID', required: true, type: 'string' }
  //#swagger.responses[200] = { description: '민원 상세 조회 성공', content: { "application/json": { example: { complaintId: "uuid-1234", userId: "user-uuid-5678", title: "엘리베이터 고장", writerName: "홍길동", createdAt: "2025-06-13T10:00:00.000Z", updatedAt: "2025-06-13T15:30:00.000Z", isPublic: true, viewsCount: 42, commentsCount: 3, status: "IN_PROGRESS", dong: "101", ho: "502", content: "엘리베이터가 자주 고장나서 불편합니다. 점검 부탁드립니다.", boardType: "COMPLAINT", comments: [{ id: "comment-uuid-9999", userId: "admin-uuid-1111", content: "확인했습니다. 조치하겠습니다.", createdAt: "2025-06-13T12:00:00.000Z", updatedAt: "2025-06-13T12:00:00.000Z", writerName: "관리자" }] } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (민원 ID 형식 오류)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (ADMIN 또는 USER 역할 필요)' }
  //#swagger.responses[404] = { description: '민원을 찾을 수 없거나 조회 권한 없음' }
  getComplaintHandler
);

/**
 * PATCH /complaints/:complaintId
 * 민원 수정 - 본인이 작성한 민원만 수정 가능 (USER만 가능)
 */
complaintRouter.route('/:complaintId').patch(
  authMiddleware,
  requireRole(['USER']),
  validateComplaintParams,
  validateComplaintPatch,
  sanitizeMiddleware('complaints'),
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 수정'
  //#swagger.description = '입주민(USER)이 본인이 작성한 민원을 수정합니다. 제목, 내용, 공개 여부를 부분적으로 수정할 수 있습니다. PENDING 상태의 민원만 수정 가능합니다. <br><br>**Request Body (모두 선택):**<br>- title (string): 민원 제목 (2-100자)<br>- content (string): 민원 내용 (10-2000자)<br>- isPublic (boolean): 공개 여부'
  //#swagger.parameters['complaintId'] = { in: 'path', description: '수정할 민원의 UUID', required: true, type: 'string' }
  //#swagger.requestBody = { required: true, content: { "application/json": { example: { title: "엘리베이터 고장 (수정됨)", content: "엘리베이터가 자주 고장나서 불편합니다. 빠른 점검 부탁드립니다.", isPublic: true } } } }
  //#swagger.responses[200] = { description: '민원 수정 성공', content: { "application/json": { example: { complaintId: "uuid-1234", userId: "user-uuid-5678", title: "엘리베이터 고장 (수정됨)", writerName: "홍길동", createdAt: "2025-06-13T10:00:00.000Z", updatedAt: "2025-06-13T16:00:00.000Z", isPublic: true, viewsCount: 42, commentsCount: 3, status: "PENDING", dong: "101", ho: "502" } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (민원 ID 형식 오류, 유효성 검증 실패, 수정할 데이터 없음)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (USER 역할 필요, 본인 민원이 아님, 또는 PENDING 상태가 아님)' }
  //#swagger.responses[404] = { description: '민원을 찾을 수 없음' }
  patchComplaintHandler
);

/**
 * DELETE /complaints/:complaintId
 * 민원 삭제 - USER: 본인만, ADMIN: 관리 아파트 모든 민원
 */
complaintRouter.route('/:complaintId').delete(
  authMiddleware,
  requireRole(['ADMIN', 'USER']),
  validateComplaintParams,
  validateComplaintDelete,
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 삭제'
  //#swagger.description = '민원을 삭제합니다. USER는 본인이 작성한 PENDING 상태의 민원만 삭제 가능하고, ADMIN은 관리 아파트의 모든 민원을 삭제할 수 있습니다(상태 무관).'
  //#swagger.parameters['complaintId'] = { in: 'path', description: '삭제할 민원의 UUID', required: true, type: 'string' }
  //#swagger.responses[200] = { description: '민원 삭제 성공', content: { "application/json": { example: { message: '정상적으로 삭제 처리되었습니다.' } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (민원 ID 형식 오류)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (USER: 본인 민원이 아니거나 PENDING 상태가 아님, ADMIN: 관리 아파트의 민원이 아님)' }
  //#swagger.responses[404] = { description: '민원을 찾을 수 없음' }
  deleteComplaintHandler
);

/**
 * PATCH /complaints/:complaintId/status
 * 민원 상태 변경 (ADMIN만 가능)
 */
complaintRouter.route('/:complaintId/status').patch(
  authMiddleware,
  requireRole(['ADMIN']),
  validateComplaintParams,
  validateComplaintPatchStatus,
  //#swagger.tags = ['Complaints']
  //#swagger.summary = '[민원] 민원 상태 변경 (관리자 전용)'
  //#swagger.description = '관리자(ADMIN)가 민원의 처리 상태를 변경합니다. 접수 중(PENDING), 처리 중(IN_PROGRESS), 완료(RESOLVED), 반려(REJECTED) 중 하나로 변경할 수 있습니다. 민원 상세 정보와 댓글 목록을 함께 반환합니다. <br><br>**Request Body:**<br>- status (string, 필수): 변경할 민원 상태 (PENDING, IN_PROGRESS, RESOLVED, REJECTED)'
  //#swagger.parameters['complaintId'] = { in: 'path', description: '상태를 변경할 민원의 UUID', required: true, type: 'string' }
  //#swagger.requestBody = { required: true, content: { "application/json": { example: { status: "RESOLVED" } } } }
  //#swagger.responses[200] = { description: '민원 상태 변경 성공', content: { "application/json": { example: { complaintId: "uuid-1234", userId: "user-uuid-5678", title: "엘리베이터 고장", writerName: "홍길동", createdAt: "2025-06-13T10:00:00.000Z", updatedAt: "2025-06-13T17:00:00.000Z", isPublic: true, viewsCount: 42, commentsCount: 3, status: "RESOLVED", dong: "101", ho: "502", content: "엘리베이터가 자주 고장나서 불편합니다. 점검 부탁드립니다.", boardType: "COMPLAINT", comments: [{ id: "comment-uuid-9999", userId: "admin-uuid-1111", content: "처리 완료했습니다.", createdAt: "2025-06-13T17:00:00.000Z", updatedAt: "2025-06-13T17:00:00.000Z", writerName: "관리자" }] } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (민원 ID 형식 오류, 유효하지 않은 상태 값)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요, 또는 관리 아파트의 민원이 아님)' }
  //#swagger.responses[404] = { description: '민원을 찾을 수 없음' }
  patchComplaintStatusHandler
);

export default complaintRouter;
