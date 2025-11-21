import prisma from '#core/prisma';

export const getPollByIdRepo = async (pollId: string) => {
  return await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });
};

export const getApartmentByUserId = async (userId: string) => {
  const apartment = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      resident: {
        select: {
          building: true,
        },
      },
    },
  });
  return apartment;
};

export const getBuildingPermissionRepo = async (pollId: string) => {
  return await prisma.poll.findUnique({
    where: {
      id: pollId,
    },
    select: {
      buildingPermission: true,
    },
  });
};

export const createVoteRepo = async (pollId: string, optionId: string, userId: string) => {
  return await prisma.pollVote.create({
    data: {
      userId,
      pollId,
      optionId,
    },
  });
};

export const cancelVoteRepo = async (pollId: string, userId: string) => {
  return await prisma.pollVote.delete({
    where: {
      pollId_userId: {
        pollId,
        userId,
      },
    },
  });
};

export const getOptionRepo = async (optionId: string) => {
  return await prisma.pollOption.findUnique({
    where: {
      id: optionId,
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          votes: true,
        },
      },
    },
  });
};

export const getOptionIdList = async (pollId: string) => {
  const optionIdList = await prisma.pollOption.findMany({
    where: { pollId },
    select: { id: true },
  });
  return optionIdList;
};

export const getOptionListRepo = async (pollId: string) => {
  return await prisma.pollOption.findMany({
    where: {
      pollId,
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          votes: true,
        },
      },
    },
  });
};

export const getPollIdByOptionId = async (optionId: string) => {
  const pollId = await prisma.pollOption.findUnique({
    where: {
      id: optionId,
    },
    select: {
      pollId: true,
    },
  });

  return pollId;
};

export const compareVoteCountRepo = async (optionIdList: string[]) => {
  const voteCounts = await prisma.pollVote.groupBy({
    by: ['optionId'],
    where: {
      optionId: { in: optionIdList },
    },
    _count: { optionId: true },
  });
  return voteCounts;
};
