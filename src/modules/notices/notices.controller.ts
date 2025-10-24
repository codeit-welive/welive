import type { RequestHandler } from 'express';
import type {
  NoticeCreateDTO,
  NoticeEntityDTO,
  NoticeQueryDTO,
  NoticeUpdateDTO,
} from '#modules/notices/dto/notices.dto';
import noticesService from './notices.service';
import { PAGINATION } from '#constants/pagination';
import { NoticeCategory } from '@prisma/client';
import ApiError from '#errors/ApiError';

/**
 * @function createNotice
 * @description 공지를 생성합니다.
 *
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 *
 * @returns {201} 생성된 공지 반환
 *
 * @throws {400} 잘못된 요청 형식
 * @throws {403} 프로젝트 접근 권한 없음
 * @throws {404} 할일을 찾을 수 없는 경우
 */

export const createNotice: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody as NoticeCreateDTO;
    await noticesService.createNotice(data);
    return res.status(201).json({ message: '정상적으로 등록 처리되었습니다.' });
  } catch (err) {
    next(err);
  }
};

export const getNoticeList: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit, category, search } = req.query;
    const dto: NoticeQueryDTO = {
      page: page ? Number(page) : PAGINATION.DEFAULT_PAGE,
      pageSize: limit ? Number(limit) : PAGINATION.DEFAULT_LIMIT,
      category: category as NoticeCategory,
      search: search ? (search as string) : null,
    };
    const rawData = await noticesService.getNoticeList(dto);
    const noticeList = rawData.data.map((notice) => ({
      id: notice.id,
      userId: notice.user.id,
      category: notice.category,
      title: notice.title,
      writerName: notice.user.name,
      createdAt: notice.createdAt.toISOString(),
      updatedAt: notice.updatedAt.toISOString(),
      viewsCount: notice.viewsCount,
      commentsCount: notice._count,
      isPinned: notice.isPinned,
    }));
    const total = rawData.total;
    return res.status(200).json({ noticeList, total });
  } catch (err) {
    next(err);
  }
};

export const getNotice: RequestHandler = async (req, res, next) => {
  try {
    const noticeId = req.params.noticeId;
    const rawData: NoticeEntityDTO = await noticesService.getNotice(noticeId);
    const { user, comments, _count: commentsCount, ...rest } = rawData;
    const commentList = comments.map((comment) => ({
      id: comment.id,
      userId: comment.user.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      writerName: comment.user.name,
    }));
    const notice = {
      ...rest,
      userId: user.id,
      writerName: user.name,
      commentsCount,
      boardName: '공지사항',
      comments: commentList,
    };
    return res.status(200).json(notice);
  } catch (err) {
    next(err);
  }
};

export const updateNotice: RequestHandler = async (req, res, next) => {
  try {
    const noticeId = req.params.noticeId;
    const userId = req.user.id;
    const data = res.locals.validatedBody as NoticeUpdateDTO;
    if (userId !== data.userId) {
      throw ApiError.forbidden('수정 권한이 없습니다.');
    }
    const rawNotice = await noticesService.updateNotice(noticeId, data);
    const { user, _count: commentsCount, ...rest } = rawNotice;
    const notice = {
      ...rest,
      userId: user.id,
      writerName: user.name,
      commentsCount,
    };
    return res.status(204).json(notice);
  } catch (err) {
    next(err);
  }
};

export const deleteNotice: RequestHandler = async (req, res, next) => {
  try {
    const noticeId = req.params.noticeId;
    await noticesService.deleteNotice(noticeId);
    return res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
  } catch (err) {
    next(err);
  }
};
