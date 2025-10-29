import { z } from 'zod';
import { UserRole, JoinStatus, BoardType } from '@prisma/client';

export const LoginDtoSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
