"use client";

import { useCallback } from "react";
import { DashboardSchema } from "@/lib/schemas/dashboard";
import type { Dashboard } from "@/lib/schemas/dashboard";
import { useDashboardStore } from "@/store/dashboard";

export function useDashboardAction() {
  const addDashboard = useDashboardStore((s) => s.addDashboard);

  const handleRenderDashboard = useCallback(
    (dashboard: unknown) => {
      const parsed = DashboardSchema.safeParse(dashboard);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.message };
      }

      addDashboard(parsed.data as Dashboard);
      return { ok: true };
    },
    [addDashboard]
  );

  return { handleRenderDashboard };
}
