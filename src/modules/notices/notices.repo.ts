import prisma from '#core/prisma';
import { NoticeCreateDTO } from '#modules/auth/dto/notice.dto';

const getBoardType = async (boardId: string) => {
  const boardType = await prisma.board.findUnique({
    where: { id: boardId },
    select: { type: true },
  });
  return boardType;
};

const create = async (data: NoticeCreateDTO, userId: string, boardId: string) => {
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      user: { connect: { id: userId } },
      board: { connect: { id: boardId } },
    },
    select: {
      category: true,
      title: true,
      content: true,
      boardId: true,
      isPinned: true,
      startDate: true,
      endDate: true,
    },
  });
  return notice;
};

export default {
  getBoardType,
  create,
};
