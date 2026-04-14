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
        // Log the full error + raw args so we can debug schema mismatches
        console.error("[useDashboardAction] Schema parse failed:", parsed.error.format());
        console.error("[useDashboardAction] Raw args.dashboard:", JSON.stringify(args.dashboard, null, 2));
        return (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300/80">
            <p className="font-semibold mb-1">Dashboard schema mismatch</p>
            <pre className="whitespace-pre-wrap opacity-70 text-[10px]">{parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("\n")}</pre>
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
