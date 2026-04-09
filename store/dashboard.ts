"use client";

import { create } from "zustand";
import type { Dashboard } from "@/lib/schemas/dashboard";

type DashboardState = {
  dashboards: Dashboard[];
  addDashboard: (dashboard: Dashboard) => void;
  clear: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  dashboards: [],
  addDashboard: (dashboard) => set((s) => ({ dashboards: [dashboard, ...s.dashboards] })),
  clear: () => set({ dashboards: [] })
}));
