import ApiError from '#errors/ApiError';
import { id } from 'zod/v4/locales';
import { createPollBodyDTO } from './dto/polls.dto';
import { createPollRepo, deletePollRepo, getPollListRepo, getPollRepo } from './polls.repo';
import { updateNotice } from '#modules/notices/notices.controller';

export const createPollService = async (data: createPollBodyDTO) => {
  await createPollRepo(data);
  return 1;
};

export const getPollListService = async (page: number, pageSize: number, boardId: string) => {
  const skip = (page - 1) * pageSize;
  const where = {
    boardId: boardId,
  };
  const rawPollList = await getPollListRepo(where, pageSize, skip);
  const pollList = rawPollList.data.map((poll) => ({
    id: poll.id,
    userId: poll.user.id,
    title: poll.title,
    writerName: poll.user.name,
    buildingPermission: poll.buildingPermission,
    createdAt: poll.createdAt.toISOString,
    updatedAt: poll.updatedAt.toISOString,
    startDate: poll.startDate.toISOString,
    endDate: poll.endDate.toISOString,
    // status: poll.status
  }));
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

export const deletePollService = async (pollId: string) => {
  await deletePollRepo(pollId);
};
