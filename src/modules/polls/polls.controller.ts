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
    const userId = req.user.id;
    const { page, limit, status, buildingPermission, keyword } = query;
    const dto: pollListQueryDTO = {
      page: Number(page) ?? PAGINATION.DEFAULT_PAGE,
      pageSize: Number(limit) ?? PAGINATION.DEFAULT_LIMIT,
      votingStatus: status as PollStatus,
      apartment: buildingPermission,
      search: keyword,
    };
    const { polls, totalCount } = await getPollListService(dto, userId);
    return res.status(200).json({ polls, totalCount });
  } catch (err) {
    next(err);
  }
};

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
    const body = res.locals.validatedBody;
    await patchPollService(pollId, body);
    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

export const deletePoll: RequestHandler = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    await deletePollService(pollId);
    return res.sendStatus(200);
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
