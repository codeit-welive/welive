import { NoticeCreateDTO, NoticeQueryDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { Prisma } from '@prisma/client';
import noticesRepo from './notices.repo';
import ApiError from '#errors/ApiError';

const createNotice = async (data: NoticeCreateDTO) => {
  return await noticesRepo.createNotice(data);
};

const getNoticeList = async (data: NoticeQueryDTO) => {
  const page = data.page;
  const pageSize = data.pageSize;
  const skip = (page - 1) * pageSize;

  const search = data.search;
  let where: Prisma.NoticeWhereInput = { category: data.category };
  if (search !== null) {
    where = {
      ...where,
      title: {
        contains: search,
      },
      content: {
        contains: search,
      },
    };
  }
  return await noticesRepo.getNoticeList(where, pageSize, skip);
};

const getNotice = async (noticeId: string) => {
  const notice = await noticesRepo.getNotice(noticeId);
  if (!notice) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  return notice;
};

const updateNotice = async (noticeId: string, data: NoticeUpdateDTO) => {
  const checkNotice = await noticesRepo.existNotice(noticeId);
  if (checkNotice < 1) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  const notice = await noticesRepo.updateNotice(noticeId, data);
  return notice;
};

const deleteNotice = async (noticeId: string) => {
  const checkNotice = await noticesRepo.existNotice(noticeId);
  if (checkNotice < 1) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  await noticesRepo.deleteNotice(noticeId);
};

export default {
  createNotice,
  getNoticeList,
  getNotice,
  updateNotice,
  deleteNotice,
};
