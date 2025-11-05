import ApiError from '#errors/ApiError';
import {
  cancelVoteRepo,
  compareVoteCountRepo,
  createVoteRepo,
  getOptionIdList,
  getOptionListRepo,
  getOptionRepo,
  getPollIdByOptionId,
} from './options.repo';

export const getPollId = async (optionId: string) => {
  const pollId = await getPollIdByOptionId(optionId);
  if (!pollId || !pollId.pollId) {
    throw ApiError.badRequest();
  }
  return pollId.pollId;
};

export const postVoteService = async (optionId: string, userId: string, pollId: string) => {
  //투표 데이터 생성(pollVote 생성)
  await createVoteRepo(pollId, optionId, userId);

  //UpdatedOption
  const rawUpdatedOption = await getOptionRepo(optionId);
  if (!rawUpdatedOption) {
    throw ApiError.notFound('투표 옵션을 찾을 수 없습니다.');
  }
  const updatedOption = {
    id: rawUpdatedOption.id,
    title: rawUpdatedOption.title,
    votes: rawUpdatedOption._count.votes.toString(),
  };

  const message = `투표 완료: ${rawUpdatedOption.title}`;

  //투표 내 옵션 아이디 가져오기 & 득표수 비교
  const optionIdList = await getOptionIdList(pollId);
  const optionIds = optionIdList.map((o) => o.id);
  const voteCounts = await compareVoteCountRepo(optionIds);
  const max = voteCounts.reduce((prev, curr) => (curr._count.optionId > prev._count.optionId ? curr : prev));
  if (!max || !max.optionId) {
    throw ApiError.notFound();
  }

  //WinnerOption
  const rawWinnerOption = await getOptionRepo(max.optionId);
  if (!rawWinnerOption) {
    throw ApiError.notFound('투표 옵션을 찾을 수 없습니다.');
  }
  const winnerOption = {
    id: rawWinnerOption.id,
    title: rawWinnerOption.title,
    votes: rawWinnerOption._count.votes.toString(),
  };

  //전체 옵션 불러오기(Options)
  const rawOptions = await getOptionListRepo(pollId);
  const options = rawOptions.map((op) => ({
    id: op.id,
    title: op.title,
    votes: op._count.votes.toString(),
  }));

  return { message, updatedOption, winnerOption, options };
};

export const deleteVoteService = async (optionId: string, userId: string, pollId: string) => {
  await cancelVoteRepo(pollId, userId);
  const rawUpdatedOption = await getOptionRepo(optionId);
  if (!rawUpdatedOption) {
    throw ApiError.notFound('투표 옵션을 찾을 수 없습니다.');
  }
  const updatedOption = {
    id: rawUpdatedOption.id,
    title: rawUpdatedOption.title,
    votes: rawUpdatedOption._count.votes.toString(),
  };
  const message = '투표가 취소되었습니다.';
  const result = { message, updatedOption };
  return result;
};
