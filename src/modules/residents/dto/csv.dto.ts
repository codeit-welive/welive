import { IsHouseholder } from '@prisma/client';
import { z } from 'zod';

export const residentCsvSchema = z.object({
  building: z.string().nonempty({ message: '동은 필수 입력 항목입니다.' }),
  unitNumber: z.string().nonempty({ message: '호수는 필수 입력 항목입니다.' }),
  contact: z.string().nonempty({ message: '연락처는 필수 입력 항목입니다.' }),
  name: z.string().nonempty({ message: '이름은 필수 입력 항목입니다.' }),
  isHouseholder: z.enum(IsHouseholder, { message: '세대주여부는 필수 입력 항목입니다.' }),
});

export type ResidentCsvDto = z.infer<typeof residentCsvSchema>;
