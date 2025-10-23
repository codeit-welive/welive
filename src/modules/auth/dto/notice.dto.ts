import * as z from 'zod';

export interface NoticeCreateDTO {
  title: string;
  content: string;
  category: 'MAINTENANCE' | 'EMERGENCY' | 'COMMUNITY' | 'RESIDENT_VOTE' | 'RESIDENT_COUNCIL' | 'COMPLAINT' | 'ETC';
}
