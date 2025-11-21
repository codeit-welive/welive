import cors from 'cors';
import env from '#core/env';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, origin);
    return callback(new Error('CORS 차단됨'));
  },
  credentials: true,
});

export default corsMiddleware;
