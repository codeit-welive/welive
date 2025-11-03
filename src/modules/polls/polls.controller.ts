import { RESPONSE_MESSAGES } from '#constants/response.constant';
import { RequestHandler } from 'express';
import { createPollBodyDTO, pollListQueryDTO } from './dto/polls.dto';
import {
  createPollService,
  deletePollService,
  getPollListService,
  getPollService,
  patchPollService,
} from './polls.service';
import { PAGINATION } from '#constants/pagination.constant';
import { PollStatus } from '@prisma/client';

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
    const body = res.locals.body as createPollBodyDTO;
    await createPollService(body);
    return res.status(201).json({ message: RESPONSE_MESSAGES.CREATE_SUCCESS });
  } catch (err) {
    next(err);
  }
};

export const getPollList: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.query;
    const boardId = res.locals.body.boardId;
    const { page, pageSize, votingStatus, apartment, search } = query;
    const dto: pollListQueryDTO = {
      page: page ? Number(page) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? Number(page) : PAGINATION.DEFAULT_LIMIT,
      votingStatus: votingStatus as PollStatus,
      apartment: apartment,
      search: search,
    };
    const { polls, totalCount } = await getPollListService(dto, boardId);
    return res.status(200).json({ polls, totalCount });
  } catch (err) {
    next(err);
  }
};

//투표 마감 시 관리자와 입주민 모두 투표 결과 조회가 가능하며,
//마감된 투표는 자동으로 공지사항에 등록됩니다.
export const getPoll: RequestHandler = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    const poll = await getPollService(pollId);
    return res.status(200).json(poll);
  } catch (err) {
    next(err);
  }
};

export const patchPoll: RequestHandler = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    const body = res.locals.validatePatchPollBody;
    const poll = await patchPollService(pollId, body);
    return res.status(200).json(poll);
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

// export const closedPoll: RequestHandler = async (req, res, next) => {
//   try {
//     const pollId = req.params.pollId;
//     await closedPollService(pollId);
//     // return res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
//   } catch (err) {
//     next(err);
//   }
// };
