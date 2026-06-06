import { create } from 'zustand';
import api from '../services/api';

export type NotificationType = 'geofence' | 'app' | 'internet' | 'pairing' | 'screen' | 'system';

export interface NotificationItem {
  id: string;
  deviceId: string;
  deviceName: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

interface InboxState {
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (ids: string[]) => Promise<void>;
}

export const useInboxStore = create<InboxState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await api.put(`/reports/notifications/${id}/read`);
    } catch (error) {
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: false } : n)),
      }));
      throw error;
    }
  },
  markAllNotificationsRead: async (ids) => {
    if (ids.length === 0) return;
    set((state) => ({
      notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
    }));
    try {
      await Promise.all(
        ids.map((id) => api.put(`/reports/notifications/${id}/read`).catch(() => undefined)),
      );
    } catch (error) {
      throw error;
    }
  },
}));
