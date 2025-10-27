import { startPollActivateJob } from './poll/poll.activate.job';
import { startPollExpireJob } from './poll/poll.expire.job';

export const startAllJobs = (): void => {
  startPollActivateJob();
  startPollExpireJob();
};
