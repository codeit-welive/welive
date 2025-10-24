import { ComplaintStatus, BoardType } from '@prisma/client';

// 댓글 응답 DTO
export interface CommentResponseDto {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  writerName: string;
}

// 민원 상세 응답 DTO
export interface ComplaintDetailResponseDto {
  complaintId: string;
  userId: string;
  title: string;
  writerName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  dong: string;
  ho: string;
  content: string;
  boardType: BoardType;
  comments: CommentResponseDto[];
}

// 민원 목록 아이템 응답 DTO
export interface ComplaintListItemResponseDto {
  complaintId: string;
  userId: string;
  title: string;
  writerName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  dong: string;
  ho: string;
}
