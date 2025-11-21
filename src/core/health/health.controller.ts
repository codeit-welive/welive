import { RequestHandler } from 'express';
import { healthService } from './health.service';

export const getHealthStatus: RequestHandler = async (_req, res) => {
  const result = await healthService.getStatus();
  res.json(result);
};
