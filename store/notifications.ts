"use client";

import { create } from "zustand";

export type Notification = {
  id: string;
  question: string;   // user's question
  answer: string;     // assistant's one-sentence reply (may be empty)
  hasDashboard: boolean;
  timestamp: Date;
  read: boolean;
};

type NotificationState = {
  notifications: Notification[];
  add: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  add: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: `notif-${Date.now()}`, timestamp: new Date(), read: false },
        ...s.notifications,
      ],
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clear: () => set({ notifications: [] }),
}));
