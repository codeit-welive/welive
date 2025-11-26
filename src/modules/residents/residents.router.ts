import { Router } from 'express';
import { downloadResidentList, downloadResidentTemplate, uploadResidentListFile } from './residents.file.controller';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';
import csvParser from '#core/middlewares/csvParser';
import {
  validateCreateResidentRequestBody,
  validatePatchResidentRequestBody,
  validateResidentListRequestQuery,
  validateResidentRequestParam,
  validateCsvHeader,
} from './residents.validator';
import {
  getResidentListHandler,
  getResidentHandler,
  patchResidentHandler,
  deleteResidentHandler,
  createResidentHandler,
} from './residents.controller';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 입주민 업로드 템플릿 다운로드
router.get(
  '/file/template',
  // #swagger.tags = ['Residents']
  // #swagger.summary = '[관리자] 입주민 업로드 템플릿 다운로드'
  // #swagger.description = '입주민 업로드용 CSV 템플릿을 다운로드합니다. 응답 헤더에 Content-Type: text/csv 및 Content-Disposition: attachment; filename="residents.csv" 등을 포함합니다.'
  // #swagger.responses[200] = { description: '입주민 업로드 템플릿 다운로드 성공', content: { "text/csv": { example: "id,building,unitNumber,contact,name,isHouseholder\n\n" } }, headers: { "Content-Type": { description: "CSV 파일 컨텐츠 타입", schema: { type: "string" } }, "Content-Disposition": { description: "파일 다운로드를 위한 헤더 예: attachment; filename=\"residents.csv\"; filename*=UTF-8'KOREAN'\"입주민명부.csv\"", schema: { type: "string" } } } }
  // #swagger.responses[400] = { description: '입주민 업로드 템플릿 다운로드 실패' }
  // #swagger.responses[500] = { description: '입주민 업로드 템플릿 다운로드 실패(서버 오류)' }
  authMiddleware,
  requireRole(['ADMIN']),
  downloadResidentTemplate
);

router.route('/file').get(
  // #swagger.tags = ['Residents']
  // #swagger.summary = '[관리자] 입주민 목록 파일 다운로드'
  // #swagger.description = '입주민 목록을 CSV 파일로 다운로드합니다. 페이지네이션 및 필터(동, 호수, 거주여부, 위리브 가입 여부, 키워드)를 지원합니다.'
  // #swagger.parameters['page'] = { in: 'query', required: false, type: 'number', description: '페이지 번호 (기본값: 1)' }
  // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'number', description: '페이지 당 아이템 수 (기본값: 20, 최대 100)' }
  // #swagger.parameters['building'] = { in: 'query', required: false, type: 'string', description: '동' }
  // #swagger.parameters['unitNumber'] = { in: 'query', required: false, type: 'string', description: '호수' }
  // #swagger.parameters['residenceStatus'] = { in: 'query', required: false, type: 'string', description: '거주 여부 (Available values: RESIDENCE, NO_RESIDENCE)' }
  // #swagger.parameters['isRegistered'] = { in: 'query', required: false, type: 'boolean', description: '위리브 가입 여부' }
  // #swagger.parameters['keyword'] = { in: 'query', required: false, type: 'string', description: '검색어(이름, 연락처)' }
  // #swagger.responses[200] = { description: '입주민 목록 파일 다운로드 성공', content: { "text/csv": { example: "id,building,unitNumber,contact,name,isHouseholder,approvalStatus\n" } }, headers: { "Content-Type": { description: "CSV 파일 컨텐츠 타입", schema: { type: "string" } }, "Content-Disposition": { description: "파일 다운로드를 위한 헤더 예: attachment; filename=\"residents_YYYYMMDD_HHMMSS.csv\"", schema: { type: "string" } } } }
  // #swagger.responses[400] = { description: '입주민 목록 파일 다운로드 실패' }
  // #swagger.responses[401] = { description: '입주민 목록 파일 다운로드 실패(권한 없음)' }
  // #swagger.responses[500] = { description: '입주민 목록 파일 다운로드 실패(서버 오류)' }
  authMiddleware,
  requireRole(['ADMIN']),
  validateResidentListRequestQuery,
  downloadResidentList
);

router.route('/from-file').post(
  // #swagger.tags = ['Residents']
  // #swagger.summary = '[관리자] 파일로부터 입주민 리소스 생성'
  // #swagger.description = 'CSV 파일을 업로드해 여러 입주민을 생성합니다. form-data의 file 필드에 CSV(binary)를 넣어 전송하세요.'
  // #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary", description: "CSV 파일" } }, required: ["file"] } } } }
  // #swagger.responses[201] = { description: '파일로부터 입주민 리소스 생성 성공', content: { "application/json": { example: { "message": "5명의 입주민이 등록되었습니다", "count": 5 } } } }
  // #swagger.responses[400] = { description: '파일로부터 입주민 리소스 생성 실패' }
  authMiddleware,
  requireRole(['ADMIN']),
  upload.single('file'),
  validateCsvHeader,
  csvParser,
  uploadResidentListFile
);

router
  .route('/:id')
  .get(
    // #swagger.tags = ['Residents']
    // #swagger.summary = '[관리자] 입주민 상세 조회'
    // #swagger.description = '경로 파라미터 id에 해당하는 입주민의 상세 정보를 조회합니다.'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: '입주민 id' }
    // #swagger.responses[200] = { description: '입주민 상세 조회 성공', content: { "application/json": { example: { "id":"string","userId":{},"building":"string","unitNumber":"string","contact":"string","name":"string","email":{},"residenceStatus":"RESIDENCE","isHouseholder":"HOUSEHOLDER","isRegistered":true,"approvalStatus":"PENDING" } } } }
    // #swagger.responses[400] = { description: '입주민 상세 조회 실패' }
    // #swagger.responses[404] = { description: '입주민을 찾을 수 없습니다' }
    // #swagger.responses[500] = { description: '서버 오류' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateResidentRequestParam,
    getResidentHandler
  )
  .patch(
    // #swagger.tags = ['Residents']
    // #swagger.summary = '[관리자] 입주민 정보 수정'
    // #swagger.description = '경로 파라미터 id에 해당하는 입주민 정보를 수정합니다.'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: '입주민 id' }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "building":"101","unitNumber":"101","contact":"01079527298","name":"홍길동","isHouseholder":"HOUSEHOLDER" } } } }
    // #swagger.responses[200] = { description: '입주민 정보 수정 성공', content: { "application/json": { example: { "id":"string","userId":{},"building":"string","unitNumber":"string","contact":"string","name":"string","email":{},"residenceStatus":"RESIDENCE","isHouseholder":"HOUSEHOLDER","isRegistered":true,"approvalStatus":"PENDING" } } } }
    // #swagger.responses[400] = { description: '입주민 정보 수정 실패' }
    // #swagger.responses[404] = { description: '입주민을 찾을 수 없습니다' }
    // #swagger.responses[500] = { description: '서버 오류' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateResidentRequestParam,
    validatePatchResidentRequestBody,
    patchResidentHandler
  )
  .delete(
    // #swagger.tags = ['Residents']
    // #swagger.summary = '[관리자] 입주민 정보 삭제'
    // #swagger.description = '경로 파라미터 id에 해당하는 입주민 정보를 삭제합니다.'
    // #swagger.parameters['id'] = { in: 'path', required: true, type: 'string', description: '입주민 id' }
    // #swagger.responses[200] = { description: '입주민 정보 삭제 성공', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
    // #swagger.responses[400] = { description: '입주민 정보 삭제 실패' }
    // #swagger.responses[404] = { description: '입주민을 찾을 수 없습니다' }
    // #swagger.responses[403] = { description: '권한 없음' }
    // #swagger.responses[500] = { description: '서버 오류' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateResidentRequestParam,
    deleteResidentHandler
  );
router
  .route('/')
  .get(
    // #swagger.tags = ['Residents']
    // #swagger.summary = '[관리자] 입주민 목록 조회'
    // #swagger.description = '입주민 목록을 조회합니다. 페이지네이션과 동(건물), 호수, 거주여부, 위리브 가입 여부, 키워드 검색을 지원합니다.'
    // #swagger.parameters['page'] = { in: 'query', required: false, type: 'number', description: '페이지 번호 (기본값: 1)' }
    // #swagger.parameters['limit'] = { in: 'query', required: false, type: 'number', description: '페이지 당 아이템 수 (기본값: 20, 최대 100)' }
    // #swagger.parameters['building'] = { in: 'query', required: false, type: 'string', description: '동' }
    // #swagger.parameters['unitNumber'] = { in: 'query', required: false, type: 'string', description: '호수' }
    // #swagger.parameters['residenceStatus'] = { in: 'query', required: false, type: 'string', description: '거주 여부 (Available values: RESIDENCE, NO_RESIDENCE)' }
    // #swagger.parameters['isRegistered'] = { in: 'query', required: false, type: 'boolean', description: '위리브 가입 여부' }
    // #swagger.parameters['keyword'] = { in: 'query', required: false, type: 'string', description: '검색어(이름, 연락처)' }
    // #swagger.responses[200] = { description: '입주민 목록 조회 성공', content: { "application/json": { example: { "residents":[ { "id":"string","userId":{},"building":"string","unitNumber":"string","contact":"string","name":"string","email":{},"residenceStatus":"RESIDENCE","isHouseholder":"HOUSEHOLDER","isRegistered":true,"approvalStatus":"PENDING" } ], "message":"string","count":0,"totalCount":0 } } } }
    // #swagger.responses[400] = { description: '입주민 목록 조회 실패' }
    // #swagger.responses[403] = { description: '권한 없음(관리자 전용)' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateResidentListRequestQuery,
    getResidentListHandler
  )
  .post(
    // #swagger.tags = ['Residents']
    // #swagger.summary = '[관리자] 입주민 리소스 생성(개별 등록)'
    // #swagger.description = '입주민(개별) 리소스를 생성합니다.'
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "building":"101","unitNumber":"101","contact":"01079527298","name":"홍길동","isHouseholder":"HOUSEHOLDER" } } } }
    // #swagger.responses[201] = { description: '입주민 리소스 생성(개별 등록) 성공', content: { "application/json": { example: { "id":"string","userId":{},"building":"string","unitNumber":"string","contact":"string","name":"string","email":{},"residenceStatus":"RESIDENCE","isHouseholder":"HOUSEHOLDER","isRegistered":true,"approvalStatus":"PENDING" } } } }
    // #swagger.responses[400] = { description: '입주민 리소스 생성(개별 등록) 실패' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateCreateResidentRequestBody,
    createResidentHandler
  );

export default router;
