import { NoticeCreateDTO } from '#modules/auth/dto/notice.dto';
import noticesRepo from './notices.repo';

const getBoardType = async (boardId: string) => {
  return await noticesRepo.getBoardType(boardId);
};
const createNotice = async (data: NoticeCreateDTO, userId: string, boardId: string) => {
  return await noticesRepo.create(data, userId, boardId);
};

export default {
  getBoardType,
  createNotice,
};
