"use client";

import { useRenderToolCall } from "@copilotkit/react-core";
import { DashboardSchema } from "@/lib/schemas/dashboard";
import DashboardRenderer from "@/components/DashboardRenderer";
import DashboardSkeleton from "@/components/DashboardSkeleton";

/**
 * Registers the client-side render function for the `render_dashboard` tool.
 *
 * The tool itself is defined as a BACKEND action in /api/copilotkit/route.ts so the
 * server-side AnthropicAdapter can resolve the tool call without a
 * MissingToolResultsError.  useRenderToolCall wires up the React rendering
 * (generative UI) without re-registering the tool as callable by the AI.
 */
export function useDashboardAction() {
  useRenderToolCall({
    name: "render_dashboard",
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
        <div className="my-2">
          {parsed.data.title && (
            <h3 className="mb-1 text-sm font-semibold text-zinc-100">
              {parsed.data.title}
            </h3>
          )}
          {parsed.data.description && (
            <p className="mb-3 text-xs text-zinc-400">{parsed.data.description}</p>
          )}
          <DashboardRenderer node={parsed.data.layout} />
        </div>
      );
    },
  });
}
