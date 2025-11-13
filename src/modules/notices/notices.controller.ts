import type { RequestHandler } from 'express';
import type { NoticeCreateDTO, NoticeListQueryDTO, NoticeUpdateDTO } from '#modules/notices/dto/notices.dto';
import { PAGINATION } from '#constants/pagination.constant';
import { NoticeCategory } from '@prisma/client';
import ApiError from '#errors/ApiError';
import {
  createNoticeService,
  deleteNoticeService,
  getNoticeListService,
  getNoticeService,
  updateNoticeService,
} from './notices.service';
import { RESPONSE_MESSAGES } from '#constants/response.constant';

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
    const userId = req.user.id;
    await createNoticeService(userId, data);
    return res.status(201).json({ message: RESPONSE_MESSAGES.CREATE_SUCCESS });
  } catch (err) {
    next(err);
  }
};

export const getNoticeList: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.query as NoticeListQueryDTO;
    const role = req.user.role;
    const userId = req.user.id;
    const { page, pageSize, category, search } = query;
    const dto: NoticeListQueryDTO = {
      page: Number(page) ?? PAGINATION.DEFAULT_PAGE,
      pageSize: Number(pageSize) ?? PAGINATION.DEFAULT_LIMIT,
      category: category as NoticeCategory,
      search: search ?? null,
    };
    const { notices, totalCount } = await getNoticeListService(dto, role, userId);
    console.log(notices);
    return res.status(200).json({ notices, totalCount });
  } catch (err) {
    next(err);
  }
};

export const getNotice: RequestHandler = async (req, res, next) => {
  try {
    const noticeId = req.params.noticeId;
    const notice = await getNoticeService(noticeId);
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
    const updatedNotice = await updateNoticeService(noticeId, data);
    return res.status(200).json(updatedNotice);
  } catch (err) {
    next(err);
  }
};

export const deleteNotice: RequestHandler = async (req, res, next) => {
  try {
    const noticeId = req.params.noticeId;
    await deleteNoticeService(noticeId);
    return res.status(200).json({ message: RESPONSE_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    next(err);
  }
};
