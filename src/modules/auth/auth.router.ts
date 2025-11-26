import { Router } from 'express';
import {
  cleanupHandler,
  deleteApartmentHandler,
  loginHandler,
  logoutHandler,
  patchAdminStatusHandler,
  patchApartmentHandler,
  patchUserStatusHandler,
  refreshTokenHandler,
  registSuperAdminHandler,
  registerAdminHandler,
  registerUserHandler,
} from './auth.controller';
import {
  validateSuperAdminCreate,
  validateAdminCreate,
  validateUserCreate,
  validateLogin,
  validatePatchStatusBody,
  validatePatchStatusParam,
  validatePatchApartmentParam,
  validatePatchApartmentBody,
  validateDeleteApartmentParam,
} from './auth.validator';
import authMiddleware from '#core/middlewares/authMiddleware';
import requireRole from '#core/middlewares/requireRole';

const authRouter = Router();

authRouter.route('/signup').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[일반 사용자] 회원가입'
  // #swagger.description = '사용자 정보를 입력받아 새로운 계정을 생성합니다. 역할에 따라 추가 정보를 입력받을 수 있습니다.'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { username: "kristy0357", password: "8tczQ0r8e_zkbE0", contact: "0189758150", name: "송하은", email: "buster_oberrbrunner4@hotmail.com", role: "USER", apartmentName: "우진아파트", apartmentDong: "127", apartmentHo: "361" } } } }
  // #swagger.responses[201] = { description: '회원가입이 완료되었습니다', content: { "application/json": { example: { id: "019ab901-0db2-75cf-b0f7-36175675dd74", name: "홍길동", email: "test@test.com", joinStatus: "PENDING", isActive: true, role: "USER" } } } }
  // #swagger.responses[400] = { description: '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다' }
  // #swagger.responses[403] = { description: '접근 권한이 없습니다(이미 로그인 상태이거나 비활성화된 계정입니다)' }
  // #swagger.responses[409] = { description: '이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다' }
  // #swagger.responses[500] = { description: '회원가입을 진행하는 중 오류가 발생했습니다' }
  validateUserCreate,
  registerUserHandler
);
authRouter.route('/signup/admin').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[관리자] 회원가입'
  // #swagger.description = '관리자 정보를 입력받아 새로운 계정을 생성합니다 역할에 따라 추가 정보를 입력받을 수 있습니다'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "username":"kristy0357","password":"8tczQ0r8e_zkbE0","contact":"0189758150","name":"송하은","email":"buster_oberrbrunner4@hotmail.com","description":"테스트 아파트 설명입니다.","startComplexNumber":"1","endComplexNumber":"19","startDongNumber":"1","endDongNumber":"15","startFloorNumber":"1","endFloorNumber":"84","startHoNumber":"1","endHoNumber":"8","role":"ADMIN","apartmentName":"다온아파트","apartmentAddress":"광주광역시 북구 9764 평택항8길","apartmentManagementNumber":"0429476502" } } } }
  // #swagger.responses[201] = { description: '회원가입이 완료되었습니다', content: { "application/json": { example: { "id":"019ab901-0db2-75cf-b0f7-36175675dd74","name":"홍길동","email":"test@test.com","joinStatus":"PENDING","isActive":true,"role":"ADMIN" } } } }
  // #swagger.responses[400] = { description: '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다' }
  // #swagger.responses[403] = { description: '접근 권한이 없습니다(이미 로그인 상태이거나 비활성화된 계정입니다)' }
  // #swagger.responses[409] = { description: '이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다' }
  // #swagger.responses[500] = { description: '회원가입을 진행하는 중 오류가 발생했습니다' }
  validateAdminCreate,
  registerAdminHandler
);
authRouter.route('/signup/super-admin').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[관리자] 회원가입'
  // #swagger.description = '관리자 정보를 입력받아 새로운 계정을 생성합니다 역할에 따라 추가 정보를 입력받을 수 있습니다'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "username":"kristy0357","password":"8tczQ0r8e_zkbE0","contact":"0189758150","name":"송하은","email":"buster_oberrbrunner4@hotmail.com","description":"테스트 아파트 설명입니다.","startComplexNumber":"1","endComplexNumber":"19","startDongNumber":"1","endDongNumber":"15","startFloorNumber":"1","endFloorNumber":"84","startHoNumber":"1","endHoNumber":"8","role":"SUPER_ADMIN","joinStatus":"APPROVED" } } } }
  // #swagger.responses[201] = { description: '회원가입이 완료되었습니다', content: { "application/json": { example: { "id":"019ab901-0db2-75cf-b0f7-36175675dd74","name":"홍길동","email":"test@test.com","joinStatus":"PENDING","isActive":true,"role":"SUPER_ADMIN" } } } }
  // #swagger.responses[400] = { description: '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다' }
  // #swagger.responses[403] = { description: '접근 권한이 없습니다(이미 로그인 상태이거나 비활성화된 계정입니다)' }
  // #swagger.responses[409] = { description: '이미 사용 중인 정보(아이디, 이메일, 전화번호)입니다' }
  // #swagger.responses[500] = { description: '회원가입을 진행하는 중 오류가 발생했습니다' }
  validateSuperAdminCreate,
  registSuperAdminHandler
);

authRouter.route('/login').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[모든 사용자] 로그인'
  // #swagger.description = '사용자 정보를 입력받아 로그인합니다.'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "username":"kristy0357","password":"yYn3NNS_dVswd02" } } } }
  // #swagger.responses[200] = { description: '로그인이 완료되었습니다', content: { "application/json": { example: { "id":"019ab901-0dd3-720b-8253-02d9eaa9805b","name":"홍길동","email":"test@test.com","role":"USER","joinStatus":"PENDING","isActive":true,"apartmentId":"019ab901-0dd3-720b-8253-0426facdf3c6","apartmentName":"테스트 아파트","residentDong":"101동","boardIds":{"COMPLAINT":"019ab901-0dd3-720b-8253-0b3a8047ddff","NOTICE":"019ab901-0dd3-720b-8253-0d2e6dc9feae","POLL":"019ab901-0dd3-720b-8253-10a44ca877ec"},"username":"user123","contact":"010-1234-5678","avatar":"https://example.com/avatar.jpg" } } } }
  // #swagger.responses[400] = { description: '잘못된 요청(필수사항 누락 또는 잘못된 입력값)입니다' }
  // #swagger.responses[401] = { description: '인증 실패(잘못된 이메일 또는 비밀번호)' }
  // #swagger.responses[403] = { description: '접근 권한이 없습니다(이미 로그인 상태이거나 비활성화된 계정입니다)' }
  // #swagger.responses[404] = { description: '사용자를 찾을 수 없습니다' }
  // #swagger.responses[500] = { description: '로그인을 진행하는 중 오류가 발생했습니다' }
  validateLogin,
  loginHandler
);
authRouter.route('/logout').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[모든 사용자] 로그아웃'
  // #swagger.responses[204] = { description: '로그아웃이 완료되었습니다' }
  // #swagger.responses[401] = { description: '로그아웃을 진행하는 중 오류가 발생했습니다' }
  authMiddleware,
  logoutHandler
);
authRouter.route('/refresh').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[모든 사용자] 토큰 갱신'
  // #swagger.responses[200] = { description: '토큰 갱신이 완료되었습니다', content: { "application/json": { example: { message: "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[401] = { description: '토큰 갱신을 진행하는 중 오류가 발생했습니다' }
  refreshTokenHandler
);

authRouter.route('/admins/:adminId/status').patch(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[슈퍼 관리자] 관리자 가입 상태 변경(단건)'
  // #swagger.description = '경로 파라미터 adminId에 해당하는 관리자 가입 상태를 변경합니다.'
  // #swagger.parameters['adminId'] = { in: 'path', required: true, type: 'string', description: 'adminId' }
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } }, example: { "status": "APPROVED" } } } }
  // #swagger.responses[200] = { description: '관리자 가입 상태 변경이 완료되었습니다', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[401] = { description: '관리자 가입 상태 변경 중 오류가 발생했습니다' }
  authMiddleware,
  requireRole(['SUPER_ADMIN']),
  validatePatchStatusParam,
  validatePatchStatusBody,
  patchAdminStatusHandler
);
authRouter.route('/admins/status').patch(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[슈퍼 관리자] 관리자 가입 상태 일괄 변경'
  // #swagger.description = '여러 관리자 계정의 가입 상태를 일괄로 변경합니다. 요청 바디에 status 값을 담아 전송하세요.'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } }, example: { "status": "APPROVED" } } } }
  // #swagger.responses[200] = { description: '관리자 가입 상태 일괄 변경이 완료되었습니다', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[401] = { description: '권한 없음(슈퍼 관리자 권한 필요)' }
  authMiddleware,
  requireRole(['SUPER_ADMIN']),
  validatePatchStatusBody,
  patchAdminStatusHandler
);

authRouter.route('/residents/:residentId/status').patch(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[관리자] 주민 가입 상태 변경(단건)'
  // #swagger.description = '경로 파라미터 residentId에 해당하는 주민의 가입 상태를 변경합니다.'
  // #swagger.parameters['residentId'] = { in: 'path', required: true, type: 'string', description: 'residentId' }
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } }, example: { "status": "APPROVED" } } } }
  // #swagger.responses[200] = { description: '주민 가입 상태 변경 성공', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[400] = { description: '잘못된 요청(필수값 누락 또는 검증 실패)' }
  authMiddleware,
  requireRole(['ADMIN']),
  validatePatchStatusParam,
  validatePatchStatusBody,
  patchUserStatusHandler
);
authRouter.route('/residents/status').patch(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[관리자] 주민 가입 상태 일괄 변경'
  // #swagger.description = '여러 주민 계정의 가입 상태를 일괄로 변경합니다. 요청 바디에 status 값을 담아 전송하세요.'
  // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } }, example: { "status": "APPROVED" } } } }
  // #swagger.responses[200] = { description: '[관리자] 주민 가입 상태 일괄 변경이 완료되었습니다', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[401] = { description: '권한 없음(관리자 권한 필요)' }
  authMiddleware,
  requireRole(['ADMIN']),
  validatePatchStatusBody,
  patchUserStatusHandler
);

authRouter
  .route('/admins/:adminID')
  .patch(
    // #swagger.tags = ['Auth']
    // #swagger.summary = '[슈퍼 관리자] 관리자 정보(아파트 정보) 수정'
    // #swagger.description = '경로 파라미터 adminId에 해당하는 관리자의 아파트 정보를 수정합니다.'
    // #swagger.parameters['adminId'] = { in: 'path', required: true, type: 'string', description: 'adminId' }
    // #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object" }, example: { "contact":"0189758150","name":"송하은","email":"buster_oberrbrunner4@hotmail.com","description":"테스트 아파트 설명입니다.","apartmentName":"다온아파트","apartmentAddress":"광주광역시 북구 9764 평택항8길","apartmentManagementNumber":"0429476502" } } } }
    // #swagger.responses[200] = { description: '관리자 정보(아파트 정보) 수정이 완료되었습니다', content: { "application/json": { example: { "message":"작업이 성공적으로 완료되었습니다" } } } }
    // #swagger.responses[401] = { description: '관리자 정보(아파트 정보) 수정 중 오류가 발생했습니다' }
    // #swagger.responses[403] = { description: '권한 없음(슈퍼 관리자 권한 필요)' }
    // #swagger.responses[404] = { description: '관리자를 찾을 수 없습니다' }
    authMiddleware,
    requireRole(['SUPER_ADMIN']),
    validatePatchApartmentParam,
    validatePatchApartmentBody,
    patchApartmentHandler
  )
  .delete(
    // #swagger.tags = ['Auth']
    // #swagger.summary = '[슈퍼관리자] 관리자 정보(아파트 정보 포함) 삭제'
    // #swagger.description = '경로 파라미터 adminId에 해당하는 관리자의 계정 및 아파트 정보를 삭제합니다.'
    // #swagger.parameters['adminId'] = { in: 'path', required: true, type: 'string', description: 'adminId' }
    // #swagger.responses[200] = { description: '관리자 정보(아파트 정보 포함) 삭제가 완료되었습니다', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
    // #swagger.responses[401] = { description: '관리자 정보(아파트 정보 포함) 삭제 중 오류가 발생했습니다' }
    // #swagger.responses[403] = { description: '권한 없음(슈퍼 관리자 권한 필요)' }
    // #swagger.responses[404] = { description: '관리자를 찾을 수 없습니다' }
    authMiddleware,
    requireRole(['SUPER_ADMIN']),
    validateDeleteApartmentParam,
    deleteApartmentHandler
  );

authRouter.route('/cleanup').post(
  // #swagger.tags = ['Auth']
  // #swagger.summary = '[최고관리자/관리자] 거절 계정 일괄 정리'
  // #swagger.description = '거절된 관리자/사용자 계정을 일괄 정리합니다.'
  // #swagger.responses[200] = { description: '거절한 관리자/사용자 정보 일괄 정리가 완료되었습니다', content: { "application/json": { example: { "message": "작업이 성공적으로 완료되었습니다" } } } }
  // #swagger.responses[401] = { description: '거절한 관리자/사용자 정보 일괄 삭제 중 오류가 발생했습니다' }
  // #swagger.responses[403] = { description: '권한 없음' }
  authMiddleware,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  cleanupHandler
);

export default authRouter;
