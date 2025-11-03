import ApiError from '#errors/ApiError';
import { createPollBodyDTO, patchPollBodyDTO, pollListQueryDTO } from './dto/polls.dto';
import {
  createPollRepo,
  deletePollRepo,
  getPollListRepo,
  getPollRepo,
  getPollStatusRepo,
  patchPollRepo,
} from './polls.repo';
import { Prisma } from '@prisma/client';

export const createPollService = async (data: createPollBodyDTO) => {
  await createPollRepo(data);
  return 1;
};

export const getPollListService = async (userId: string, data: pollListQueryDTO, boardId: string) => {
  const pageSize = data.pageSize;
  const skip = (data.page - 1) * pageSize;
  const search = data.search;
  const status = data.votingStatus;
  const apartment = Number(data.apartment);
  let where: Prisma.PollWhereInput = { boardId: boardId }; // 입주민은 자신이 투표권자로 설정된 투표만 참여 가능하고, 투표권자와 투표 상태로 필터링 및 검색이 가능.
  if (status === 'CLOSED') {
    where = {
      ...where,
      status: status,
      OR: [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };
  } else if (status === 'IN_PROGRESS') {
    where = {
      ...where,
      status: status,
      OR: [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };
  } else if (status === 'PENDING') {
    where = {
      ...where,
      status: status,
      OR: [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };
  }
  if (apartment) {
    where = {
      ...where,
      buildingPermission: apartment,
    };
  }
  const rawPollList = await getPollListRepo(where, pageSize, skip);
  const polls = rawPollList.data.map((poll) => ({
    id: poll.id,
    userId: poll.user.id,
    title: poll.title,
    writerName: poll.user.name,
    buildingPermission: poll.buildingPermission,
    createdAt: poll.createdAt.toISOString,
    updatedAt: poll.updatedAt.toISOString,
    startDate: poll.startDate.toISOString,
    endDate: poll.endDate.toISOString,
    status: poll.status,
  }));
  const totalCount = rawPollList.total;
  return { polls, totalCount };
};

export const getPollService = async (pollId: string) => {
  const rawPoll = await getPollRepo(pollId);
  if (!rawPoll) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  const { user, board, ...rest } = rawPoll;
  const poll = {
    ...rest,
    userId: user.id,
    writerName: user.name,
    boardName: board.type,
  };
  return poll;
};

export const patchPollService = async (pollId: string, data: patchPollBodyDTO) => {
  const status = await getPollStatusRepo(pollId);
  if (!status) {
    throw ApiError.badRequest;
  }
  if (status.status !== 'PENDING') {
    throw ApiError.unprocessable('투표 시작 후에는 수정을 할 수 없습니다.');
  }
  const poll = await patchPollRepo(pollId, data);
  return poll;
};

export const deletePollService = async (pollId: string) => {
  const status = await getPollStatusRepo(pollId);
  if (!status) {
    throw ApiError.badRequest;
  }
  if (status.status !== 'PENDING') {
    throw ApiError.unprocessable('투표 시작 후에는 삭제할 수 없습니다.');
  }
  await deletePollRepo(pollId);
};
