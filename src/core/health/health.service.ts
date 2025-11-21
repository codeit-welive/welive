import prisma from '#core/prisma';

export const healthService = {
  async getStatus() {
    const db = await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      uptime: process.uptime(),
      db: db ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  },
};
