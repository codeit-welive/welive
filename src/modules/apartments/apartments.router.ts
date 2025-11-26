import { Router } from 'express';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import { validateApartmentRequestParams, validateApartmentRequestQuery } from './apartments.validator';
import { getApartmentHandler, getApartmentListHandler } from './apartments.controller';

const apartmentRouter = Router();

apartmentRouter.route('/public').get(
  // #swagger.tags = ['Apartments']
  // #swagger.summary = '[공개용/회원가입] 아파트 목록 조회'
  // #swagger.description = '아파트 목록을 조회합니다.'
  // #swagger.responses[200] = { description: '아파트 목록 조회 성공(공개)', content: { "application/json": { example: { "apartments": [ { "id":"019752f2-d1d3-771f-ae1c-1db22e1618f0","name":"테스트아파트 (제한된 정보에 포함)","address":"서울시 중구 필지구로 100 (제한된 정보에 포함)" } ], "totalCount": 0 } } } }
  validateApartmentRequestQuery,
  getApartmentListHandler
);
apartmentRouter.route('/public/:id').get(
  // #swagger.tags = ['Apartments']
  // #swagger.summary = '[공개용/회원가입] 아파트 기본 정보 상세 조회'
  // #swagger.description = '경로 파라미터 id에 해당하는 아파트의 공개용(제한된) 기본 정보를 조회합니다.'
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: '아파트 id' }
  // #swagger.responses[200] = { description: '아파트 상세 조회 성공', content: { "application/json": { example: { "id":"019752f2-d1d3-771f-ae1c-1db22e1618f0","name":"테스트아파트 (제한된 정보에 포함)","address":"서울시 중구 필지구로 100 (제한된 정보에 포함)","officeNumber":"0262008700","description":"테스트 아파트 설명입니다.","startComplexNumber":"1","endComplexNumber":"19","startDongNumber":"1","endDongNumber":"15","startFloorNumber":"1","endFloorNumber":"84","startHoNumber":"1","endHoNumber":"8","apartmentStatus":"PENDING","dongRange":{"start":"101","end":"108"},"hoRange":{"start":"101","end":"2508"} } } } }
  // #swagger.responses[400] = { description: '잘못된 요청' }
  // #swagger.responses[403] = { description: '권한 없음' }
  // #swagger.responses[404] = { description: '아파트를 찾을 수 없습니다' }
  validateApartmentRequestParams,
  getApartmentHandler
);

apartmentRouter.route('/').get(
  // #swagger.tags = ['Apartments']
  // #swagger.summary = '[슈퍼관리자/관리자] 아파트 목록 조회'
  // #swagger.description = '관리자용 아파트 목록 조회. 이름, 주소, 검색키워드, 상태로 필터링 가능하며 페이지네이션 지원(page, limit).'
  // #swagger.parameters['searchKeyword'] = { in: 'query', required: false, type: 'string', description: '검색 키워드 (이름, 주소, 관리자 이름, 관리자 이메일)' }
  // #swagger.parameters['apartmentStatus'] = { in: 'query', required: false, type: 'string', description: '아파트 상태 (예: PENDING, APPROVED, REJECTED)' }
  // #swagger.parameters['page'] = { in: 'query', required: false, type: 'number', description: '페이지 번호' }
  // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'number', description: '페이지 당 항목 수' }
  // #swagger.responses[200] = { description: '아파트 목록 조회 성공', content: { "application/json": { example: { "apartments": [ { "id":"019752f2-d1d3-771f-ae1c-1db22e1618f0","name":"테스트아파트 (제한된 정보에 포함)","address":"서울시 중구 필지구로 100 (제한된 정보에 포함)","officeNumber":"0262008700","description":"테스트 아파트 설명입니다.","startComplexNumber":"1","endComplexNumber":"19","startDongNumber":"1","endDongNumber":"15","startFloorNumber":"1","endFloorNumber":"84","startHoNumber":"1","endHoNumber":"8","apartmentStatus":"PENDING","adminId":"019752f2-d1d3-771f-ae1c-1db22e1618f0","adminName":"김길수","adminContact":"01012345678","adminEmail":"kim@example.com" } ], "totalCount": 0 } } } }
  // #swagger.responses[400] = { description: '아파트 목록 조회 실패' }
  // #swagger.responses[403] = { description: '권한 없음(관리자 전용)' }
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateApartmentRequestQuery,
  getApartmentListHandler
);
apartmentRouter.route('/:id').get(
  // #swagger.tags = ['Apartments']
  // #swagger.summary = '[슈퍼관리자/관리자] 아파트 상세 조회'
  // #swagger.description = '경로 파라미터 id에 해당하는 아파트의 상세 정보를 조회합니다.'
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: '아파트 id' }
  // #swagger.responses[200] = { description: '아파트 상세 조회 성공', content: { "application/json": { example: { "id":"019752f2-d1d3-771f-ae1c-1db22e1618f0","name":"테스트아파트 (제한된 정보에 포함)","address":"서울시 중구 필지구로 100 (제한된 정보에 포함)","officeNumber":"0262008700","description":"테스트 아파트 설명입니다.","startComplexNumber":"1","endComplexNumber":"19","startDongNumber":"1","endDongNumber":"15","startFloorNumber":"1","endFloorNumber":"84","startHoNumber":"1","endHoNumber":"8","apartmentStatus":"PENDING","adminId":"019752f2-d1d3-771f-ae1c-1db22e1618f0","adminName":"김길수","adminContact":"01012345678","adminEmail":"kim@example.com","dongRange":{"start":"101","end":"108"},"hoRange":{"start":"101","end":"2508"} } } } }
  // #swagger.responses[400] = { description: '잘못된 요청' }
  // #swagger.responses[403] = { description: '권한 없음(관리자 전용)' }
  // #swagger.responses[404] = { description: '아파트를 찾을 수 없습니다' }
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'USER']),
  validateApartmentRequestParams,
  getApartmentHandler
);

export default apartmentRouter;
