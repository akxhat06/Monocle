"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { DashboardSchema } from "@/lib/schemas/dashboard";
import type { Dashboard } from "@/lib/schemas/dashboard";
import { useDashboardStore } from "@/store/dashboard";
import DashboardRenderer from "@/components/DashboardRenderer";
import DashboardSkeleton from "@/components/DashboardSkeleton";

export function useDashboardAction() {
  const addDashboard = useDashboardStore((s) => s.addDashboard);

  useCopilotAction({
    name: "render_dashboard",
    description:
      "Render an analytics dashboard from a JSON layout tree. Call this after gathering data with run_analytics_query.",
    parameters: [
      {
        name: "dashboard",
        type: "object" as const,
        description: "The dashboard object with title, description, and layout tree.",
        required: true,
      },
    ],
    render: ({ status, args }) => {
      if (status !== "complete") {
        return <DashboardSkeleton />;
      }

      const parsed = DashboardSchema.safeParse(args.dashboard);
      if (!parsed.success) {
        return (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
            Failed to parse dashboard: {parsed.error.message}
          </div>
        );
      }

      return (
        <div className="my-2 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
          {parsed.data.title && (
            <h3 className="mb-1 text-lg font-semibold text-zinc-100">
              {parsed.data.title}
            </h3>
          )}
          {parsed.data.description && (
            <p className="mb-3 text-sm text-zinc-400">
              {parsed.data.description}
            </p>
          )}
          <DashboardRenderer node={parsed.data.layout} />
        </div>
      );
    },
    handler: async ({ dashboard }) => {
      const parsed = DashboardSchema.safeParse(dashboard);
      if (parsed.success) {
        addDashboard(parsed.data as Dashboard);
      }
      return parsed.success
        ? "Dashboard rendered successfully."
        : `Dashboard parse error: ${parsed.error?.message}`;
    },
  });
}
