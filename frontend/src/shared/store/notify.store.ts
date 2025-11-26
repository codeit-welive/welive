import { create } from 'zustand';

export interface Notification {
  notificationId: string;
  content: string;
  notificationType: string;
  notifiedAt: string;
  isChecked: boolean;
  complaintId?: string;
  noticeId?: string;
  pollId?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotifications: (incoming: Notification[]) => void;
  removeNotification: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotifications: (incoming) =>
    set((state) => {
      const existing = new Set(state.notifications.map((n) => n.notificationId));
      const filtered = incoming.filter((n) => !existing.has(n.notificationId));
      const merged = [...state.notifications, ...filtered];

      merged.sort((a, b) => new Date(b.notifiedAt).getTime() - new Date(a.notifiedAt).getTime());

      return { notifications: merged };
    }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.notificationId !== id),
    })),

  clear: () => set({ notifications: [] }),
}));
