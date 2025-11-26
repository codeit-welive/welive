import express from 'express';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import { cancelVote, postVote } from './options.controller';
import { validateDeleteVoteParams, validatePostVoteParams } from './options.validator';

const optionRouter = express.Router();

//#swagger.tags = ['Options']

optionRouter
  .route('/:optionId/vote')
  .post(
    authMiddleware,
    validatePostVoteParams,
    requireRole(['USER']),
    postVote
    //#swagger.summary = '투표하기'
    //#swagger.description = 'pollOption(optionId)에 대해 USER 권한 사용자가 투표를 수행합니다.'
    //#swagger.parameters['optionId'] = { in: 'path', required: true, description: '투표 옵션 ID(UUID)', schema: { type: 'string', format: 'uuid' } }
    //#swagger.responses[200] = { description: '투표 성공', content: { "application/json": { example: { message: "투표 완료: 옵션 제목", updatedOption: { id: "optionId", title: "옵션 제목", votes: "3" }, winnerOption: { id: "optionId", title: "옵션 제목", votes: "5" }, options: [ { id: "optionId", title: "옵션 제목", votes: "득표수" } ] } } } }
  )
  .delete(
    authMiddleware,
    validateDeleteVoteParams,
    requireRole(['USER']),
    cancelVote
    //#swagger.summary = '투표 취소'
    //#swagger.description = 'USER 권한 사용자가 해당 옵션(optionId)에 대해 투표를 취소합니다.'
    //#swagger.parameters['optionId'] = { in: 'path', required: true, description: '투표 옵션 ID(UUID)', schema: { type: 'string', format: 'uuid' } }
    //#swagger.responses[200] = { description: '투표 취소 성공', content: { "application/json": { example: { message: "투표가 취소되었습니다.", updatedOption: { id: "optionId", title: "옵션 제목", votes: "1" } } } } }
  );

export default optionRouter;
