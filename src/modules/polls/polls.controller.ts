import { RESPONSE_MESSAGES } from '#constants/response.constant';
import { RequestHandler } from 'express';
import { createPollBodyDTO } from './dto/polls.dto';
import { createPollService, deletePollService, getPollListService, getPollService } from './polls.service';
import { PAGINATION } from '#constants/pagination.constant';

/**
 * @function createPoll
 * @description 투표를 생성합니다.
 *
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 *
 * @returns {201} 생성된 공지 반환
 *
 * @throws {400} 잘못된 요청 형식
 * @throws {403} 프로젝트 접근 권한 없음
 * @throws {404} 할일을 찾을 수 없는 경우
 */

export const createPoll: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as createPollBodyDTO;
    await createPollService(body);
    return res.status(201).json({ message: RESPONSE_MESSAGES.CREATE_SUCCESS });
  } catch (err) {
    next(err);
  }
};

export const getPollList: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.query
    const boardId = req.params.boardId
    const {page, pageSize} = query;
    const dto = {
      page: page ? Number(page) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? Number(page) : PAGINATION.DEFAULT_LIMIT,
    };
    const {polls, total} = await getPollListService(page, pageSize, boardId)
  }
}

export const getPoll: RequestHandler = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    const poll = await getPollService(pollId);
    return poll;
  } catch (err) {
    next(err);
  }
};

export const deletePoll: RequestHandler = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    await deletePollService(pollId);
    return res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    next(err);
  }
};
