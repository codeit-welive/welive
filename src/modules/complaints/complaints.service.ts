import ApiError from '#errors/ApiError';
import { BoardType } from '@prisma/client';
import * as ComplaintRepo from './complaints.repo.js';
import { ComplaintCreateDto, ComplaintPatchDto } from './dto/complaints.dto.js';
import { ComplaintListQuery } from './dto/querys.dto.js';

const validateComplaintBoard = async (userId: string) => {
  // 1. 게시판 검증
  const boardId = await ComplaintRepo.getComplaintBoardIdByUserId(userId);

  if (!boardId) {
    throw ApiError.forbidden('게시판을 찾을 수 없습니다.');
  }

  return boardId;
};

export const createComplaint = async (data: ComplaintCreateDto) => {
  // 검증
  const userBoardId = await validateComplaintBoard(data.userId);
  if (data.boardId !== userBoardId) {
    throw ApiError.forbidden('해당 게시판에 글을 작성할 권한이 없습니다.');
  }

  // 생성
  await ComplaintRepo.create(data);
};

export const getComplaintList = async (userId: string, query: ComplaintListQuery) => {
  // 1. boardId 찾기
  const boardId = await validateComplaintBoard(userId);

  // 2. 민원 목록 + 전체 개수 병렬 조회
  const [complaints, totalCount] = await Promise.all([
    ComplaintRepo.getList(boardId, query.page, query.limit),
    ComplaintRepo.getCount(boardId),
  ]);

  // 3. 응답 형식 변환
  return {
    complaints: complaints.map((complaint) => ({
      complaintId: complaint.id,
      userId: complaint.userId,
      title: complaint.title,
      writerName: complaint.user.name,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      isPublic: complaint.isPublic,
      viewsCount: complaint.viewsCount,
      commentsCount: complaint._count.comments,
      status: complaint.status,
      dong: complaint.user.resident!.building,
      ho: complaint.user.resident!.unitNumber,
    })),
    totalCount,
  };
};

export const getComplaint = async (complaintId: string) => {
  const complaint = await ComplaintRepo.getById(complaintId);

  if (!complaint) {
    throw ApiError.notFound('민원을 찾을 수 없습니다.');
  }
  return {
    complaintId: complaint.id,
    userId: complaint.userId,
    title: complaint.title,
    writerName: complaint.user.name,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    isPublic: complaint.isPublic,
    viewsCount: complaint.viewsCount,
    commentsCount: complaint._count.comments,
    status: complaint.status,
    dong: complaint.user.resident!.building,
    ho: complaint.user.resident!.unitNumber,
    content: complaint.content,
    boardType: BoardType.COMPLAINT,
    comments: complaint.comments.map((comment) => ({
      id: comment.id,
      userId: comment.user.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      writerName: comment.user.name,
    })),
  };
};

export const patchComplaint = async (complaintId: string, loginUserId: string, data: ComplaintPatchDto) => {
  if (Object.keys(data).length === 0) {
    throw ApiError.badRequest('수정할 내용이 없습니다.');
  }
  const authorId = await ComplaintRepo.getUserIdByComplaintId(complaintId);
  if (!authorId) {
    throw ApiError.notFound('민원을 찾을 수 없습니다.');
  }

  if (authorId.userId !== loginUserId) {
    throw ApiError.forbidden('민원을 수정할 권한이 없습니다');
  }

  const complaint = await ComplaintRepo.patch(complaintId, data);
  return {
    complaintId: complaint.id,
    userId: complaint.userId,
    title: complaint.title,
    writerName: complaint.user.name,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    isPublic: complaint.isPublic,
    viewsCount: complaint.viewsCount,
    commentsCount: complaint._count.comments,
    status: complaint.status,
    dong: complaint.user.resident!.building,
    ho: complaint.user.resident!.unitNumber,
  };
};
