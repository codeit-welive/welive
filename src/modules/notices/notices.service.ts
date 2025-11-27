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
import { createLimit } from '#core/utils/Limiter';
import { getUserIdsForApartment } from '#modules/auth/auth.service';
import { createAndSendNotification } from '#core/utils/notificationHelper';
import { getApartmentNameByIdRepo } from '#modules/apartments/apartments.repo';

const limit = createLimit(5);

/**
 * 공지사항 생성 + 해당 아파트 주민 전체에 알림 전송
 *
 * @description
 * - 오직 createNotice 시점에만 알림을 전송한다.
 * - 알림 대상: 해당 아파트 USER 전체
 * - 알림 내용: "새로운 공지사항이 등록되었습니다."
 */
export const createNoticeService = async (userId: string, data: NoticeCreateDTO) => {
  // 1. 관리자가 속한 아파트 ID 조회
  const apartment = await getApartmentIdByAdminId(userId);
  if (!apartment?.id) throw ApiError.badRequest();

  const apartmentName = await getApartmentNameByIdRepo(apartment.id);
  if (!apartmentName) throw ApiError.badRequest();

  // 2. 공지 생성
  const notice = await createNoticeRepo(data, apartment.id);

  // 3. 아파트 주민 전체 ID 조회
  const residentUserIds = (await getUserIdsForApartment(apartmentName)).map((u) => u.id);

  if (residentUserIds.length === 0) {
    return notice;
  }

  // 4. 알림 내용
  const content = '새로운 공지사항이 등록되었습니다.';

  // 5. 병렬 알림 전송
  const tasks = residentUserIds.map((uid) =>
    limit(async () => {
      try {
        await createAndSendNotification(
          {
            content,
            notificationType: 'NOTICE_REG',
            recipientId: uid,
            noticeId: notice.id,
          },
          uid
        );
      } catch {
        // 전송 실패는 무시 (best-effort)
      }
    })
  );

  await Promise.allSettled(tasks);

  return notice;
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
