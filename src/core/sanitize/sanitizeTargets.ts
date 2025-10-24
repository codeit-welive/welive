export type SanitizeDomain = 'notices' | 'complaints' | 'polls' | 'pollOptions' | 'comments' | 'notifications';

export const sanitizeTargets: Record<SanitizeDomain, readonly string[]> = {
  notices: ['title', 'content'],
  complaints: ['title', 'content'],
  polls: ['title', 'content'],
  pollOptions: ['title', 'content'],
  comments: ['title', 'content'],
  notifications: ['title', 'content'],
};
