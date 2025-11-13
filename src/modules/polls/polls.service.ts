import ApiError from '#errors/ApiError';
import { createPollBodyDTO, patchPollBodyDTO, pollListQueryDTO } from './dto/polls.dto';
import {
  createPollRepo,
  deletePollRepo,
  getApartmentIdByAdminId,
  getBoardIdByAdminId,
  getBoardIdByUserId,
  getPollListRepo,
  getPollRepo,
  getPollStatusRepo,
  patchPollRepo,
  //   pollNoticeRepo,
} from './polls.repo';
import { Prisma, UserRole } from '@prisma/client';

export const createPollService = async (userId: string, data: createPollBodyDTO) => {
  const apartmentId = await getApartmentIdByAdminId(userId);
  if (!apartmentId) {
    throw ApiError.badRequest();
  }
  await createPollRepo(data, apartmentId.id);
};

export const getPollListService = async (data: pollListQueryDTO, userId: string, role: UserRole) => {
  const pageSize = data.pageSize;
  const skip = (data.page - 1) * pageSize;
  const search = data.search;
  const status = data.votingStatus;
  const apartment = Number(data.apartment);
  let boardId;
  if (role === UserRole.USER) {
    boardId = await getBoardIdByUserId(userId);
  } else if (role === UserRole.ADMIN) {
    boardId = await getBoardIdByAdminId(userId);
  }
  if (!boardId || !boardId.id) {
    throw ApiError.forbidden;
  }
  let where: Prisma.PollWhereInput = { boardId: boardId.id };
  if (status) {
    where = {
      ...where,
      status,
    };
  }
  if (search) {
    where = {
      ...where,
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
    pollId: poll.id,
    userId: poll.user.id,
    title: poll.title,
    writerName: poll.user.name,
    buildingPermission: poll.buildingPermission,
    createdAt: poll.createdAt.toISOString(),
    updatedAt: poll.updatedAt.toISOString(),
    startDate: poll.startDate.toISOString(),
    endDate: poll.endDate.toISOString(),
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
  const { id, user, board, ...rest } = rawPoll;
  const poll = {
    ...rest,
    pollId: id,
    userId: user.id,
    writerName: user.name,
    boardName: board.type,
  };
  return poll;
};

export const patchPollService = async (pollId: string, data: patchPollBodyDTO) => {
  const status = await getPollStatusRepo(pollId);
  if (!status) {
    throw ApiError.badRequest();
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
    throw ApiError.badRequest();
  }
  if (status.status !== 'PENDING') {
    throw ApiError.unprocessable('투표 시작 후에는 삭제할 수 없습니다.');
  }
  await deletePollRepo(pollId);
};

// export const closedPollService = async (pollId: string) => {
//   const status = await getPollStatusRepo(pollId);
//   if (!status) {
//     throw ApiError.badRequest();
//   }
//   if (status.status === 'CLOSED') {
//     const pollNotice = await pollNoticeRepo(pollId);
//   }
// };
