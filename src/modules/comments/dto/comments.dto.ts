import { BoardType, Prisma, UserRole } from '@prisma/client';
import { z } from 'zod';

export const commentCreateSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  content: z
    .string()
    .min(1, '댓글 내용은 최소 1자 이상이어야 합니다.')
    .max(500, '댓글 내용은 최대 500자까지 가능합니다.'),
  boardType: z.enum([BoardType.COMPLAINT, BoardType.NOTICE], '지원하지 않는 게시판 타입입니다.'),
  boardId: z.uuid({ message: '유효한 게시글 ID가 아닙니다.' }),
  role: z.enum([UserRole.ADMIN, UserRole.USER], '댓글 작성 권한이 없는 역할입니다.'),
});

export const commentPatchSchema = commentCreateSchema.extend({
  commentId: z.uuid({ message: '유효한 댓글 ID가 아닙니다.' }),
});

export const commentDeleteSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  role: z.enum([UserRole.ADMIN, UserRole.USER], '댓글 작성 권한이 없는 역할입니다.'),
  commentId: z.uuid({ message: '유효한 댓글 ID가 아닙니다.' }),
});

export type CommentWithUserDto = Prisma.CommentGetPayload<{
  select: {
    id: true;
    userId: true;
    content: true;
    createdAt: true;
    updatedAt: true;
    user: {
      select: {
        name: true;
      };
    };
  };
}>;

export type CommentCreateDto = z.infer<typeof commentCreateSchema>;
export type CommentPatchDto = z.infer<typeof commentPatchSchema>;
export type CommentDeleteDto = z.infer<typeof commentDeleteSchema>;
