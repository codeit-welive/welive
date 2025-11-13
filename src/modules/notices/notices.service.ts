import { NoticeCreateDTO, NoticeListQueryDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { Prisma, UserRole } from '@prisma/client';
import {
  createNoticeRepo,
  deleteNoticeRepo,
  existNoticeRepo,
  getApartmentIdByAdminId,
  getBoardIdByAdminId,
  getBoardIdByUserId,
  getNoticeListRepo,
  getNoticeRepo,
  updateNoticeRepo,
} from './notices.repo';
import ApiError from '#errors/ApiError';

export const createNoticeService = async (userId: string, data: NoticeCreateDTO) => {
  const apartmentId = await getApartmentIdByAdminId(userId);
  if (!apartmentId) {
    throw ApiError.badRequest();
  }
  return await createNoticeRepo(data, apartmentId.id);
};

export const getNoticeListService = async (data: NoticeListQueryDTO, role: UserRole, userId: string) => {
  const page = data.page;
  const pageSize = data.pageSize;
  const skip = (page - 1) * pageSize;
  let boardId;
  if (role === UserRole.USER) {
    boardId = await getBoardIdByUserId(userId);
  } else if (role === UserRole.ADMIN) {
    boardId = await getBoardIdByAdminId(userId);
  }
  if (!boardId || !boardId.id) {
    throw ApiError.forbidden();
  }
  const search = data.search;
  let where: Prisma.NoticeWhereInput = { boardId: boardId.id };
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
  if (data.category) {
    where = {
      ...where,
      category: data.category,
    };
  }
  const rawNoticeList = await getNoticeListRepo(where, pageSize, skip);
  const notices = rawNoticeList.data.map((notice) => ({
    noticeId: notice.id,
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
  const totalCount = rawNoticeList.total;
  return { notices, totalCount };
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
  const { id, user, _count: commentsCount, ...rest } = notice;
  const updatedNotice = {
    ...rest,
    noticeId: id,
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
