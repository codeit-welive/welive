import prisma from '#core/prisma';

export const updateVoteRepo = async (optionId: string) => {
  const vote = await prisma.pollVote.update({});
};
