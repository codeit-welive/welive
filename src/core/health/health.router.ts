import { Router } from 'express';
import { getHealthStatus } from './health.controller';

const router = Router();

/**
 * @route GET /api
 * @description 서버 및 DB 헬스체크
 * @returns { status, uptime, db, timestamp }
 */
router.get(
  '/',
  //#swagger.tags = ['Health']
  //#swagger.summary = '서버 및 DB 헬스체크'
  //#swagger.description = '서버 실행 상태, DB 연결 여부, Uptime, Timestamp 등을 확인하기 위한 헬스체크 엔드포인트입니다.'
  //#swagger.responses[200] = { description: '정상적으로 헬스체크 응답 반환', content: { "application/json": { example: { status: "ok", uptime: 1234.56, db: "connected", timestamp: "2025-11-26T07:00:00.000Z" } } } }
  //#swagger.responses[500] = { description: '헬스체크 실패 또는 DB 연결 오류', content: { "application/json": { example: { error: "Health check failed" } } } }
  getHealthStatus
);

export default router;
