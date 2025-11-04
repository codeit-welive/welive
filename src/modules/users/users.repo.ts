import prisma from '#core/prisma';

export const findUserById = async (id: string) => prisma.user.findUnique({ where: { id } });

export const updateUser = async (id: string, data: Record<string, any>) => prisma.user.update({ where: { id }, data });
