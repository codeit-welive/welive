import { RequestHandler } from 'express';
import { deleteVoteService, getBuildingPermission, getPollId, postVoteService } from './options.service';

export const postVote: RequestHandler = async (req, res, next) => {
  try {
    const optionId = res.locals.validatedParams.optionId;
    const userId = req.user.id;
    const pollId = await getPollId(optionId);
    await getBuildingPermission(userId, pollId);
    const result = await postVoteService(optionId, userId, pollId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const cancelVote: RequestHandler = async (req, res, next) => {
  try {
    const optionId = res.locals.validatedParams.optionId;
    const userId = req.user.id;
    const pollId = await getPollId(optionId);
    await getBuildingPermission(userId, pollId);
    const result = await deleteVoteService(optionId, userId, pollId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
