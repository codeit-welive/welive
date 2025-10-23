import type { User, Notice } from '@prisma/client';

export interface NoticeCreateDTO {
  title: string;
  content: string;
  category: 'MAINTENANCE' | 'EMERGENCY' | 'COMMUNITY' | 'RESIDENT_VOTE' | 'RESIDENT_COUNCIL' | 'COMPLAINT' | 'ETC';
}
