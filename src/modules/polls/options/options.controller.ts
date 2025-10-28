import { RequestHandler } from 'express';

export const vote: RequestHandler = async (req, res, next) => {
  try {
    const optionId = req.params.optionId;
    const data = req.body;
  } catch (err) {
    next(err);
  }
};

export const cancelVote: RequestHandler = async (req, res, next) => {
  try {
    const optionId = req.params.optionId;
  } catch (err) {
    next(err);
  }
};
