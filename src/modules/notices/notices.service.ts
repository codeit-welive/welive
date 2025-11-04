import { NoticeCreateDTO, NoticeListQueryDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { Prisma } from '@prisma/client';
import {
  createNoticeRepo,
  deleteNoticeRepo,
  existNoticeRepo,
  getBoardTypeRepo,
  getNoticeListRepo,
  getNoticeRepo,
  updateNoticeRepo,
} from './notices.repo';
import ApiError from '#errors/ApiError';

export const createNoticeService = async (data: NoticeCreateDTO) => {
  return await createNoticeRepo(data);
};

export const getNoticeListService = async (data: NoticeListQueryDTO) => {
  const page = data.page;
  const pageSize = data.pageSize;
  const skip = (page - 1) * pageSize;

  const search = data.search;
  let where: Prisma.NoticeWhereInput = { category: data.category };
  if (search !== null) {
    where = {
      ...where,
      OR: [
        {
          title: {
            contains: search,
          },
        },
        {
          content: {
            contains: search,
          },
        },
      ],
    };
  }
  const rawNoticeList = await getNoticeListRepo(where, pageSize, skip);
  const noticeList = rawNoticeList.data.map((notice) => ({
    id: notice.id,
    userId: notice.user.id,
    category: notice.category,
    title: notice.title,
    writerName: notice.user.name,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    viewsCount: notice.viewsCount,
    commentsCount: notice._count.comments,
    isPinned: notice.isPinned,
  }));
  const total = rawNoticeList.total;
  return { noticeList, total };
};

export const getNoticeService = async (noticeId: string) => {
  const rawNotice = await getNoticeRepo(noticeId);

  if (!rawNotice) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }

  const { user, comments, _count, board, ...rest } = rawNotice;

  const commentList = comments.map((comment) => ({
    id: comment.id,
    userId: comment.user.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    writerName: comment.user.name,
  }));

  return {
    ...rest,
    userId: user.id,
    writerName: user.name,
    commentsCount: _count.comments,
    boardName: board?.type ?? null,
    comments: commentList,
  };
};

export const updateNoticeService = async (noticeId: string, data: NoticeUpdateDTO) => {
  const checkNotice = await existNoticeRepo(noticeId);
  if (!checkNotice) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  const notice = await updateNoticeRepo(noticeId, data);
  const { user, _count: commentsCount, ...rest } = notice;
  const updatedNotice = {
    ...rest,
    userId: user.id,
    writerName: user.name,
    commentsCount,
  };
  return updatedNotice;
};

export const deleteNoticeService = async (noticeId: string) => {
  const checkNotice = await existNoticeRepo(noticeId);
  if (!checkNotice) {
    throw ApiError.notFound('게시글을 찾을 수 없습니다.');
  }
  await deleteNoticeRepo(noticeId);
};
