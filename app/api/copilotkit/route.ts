import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  type CopilotServiceAdapter,
  type CopilotRuntimeChatCompletionRequest,
} from "@copilotkit/runtime";
import { getServiceAdapter } from "@/lib/llm";
import { runAnalyticsQuery } from "@/lib/data/query";
import { SCHEMA_DESCRIPTION } from "@/lib/prompts/system";

/**
 * Wrap the base adapter to silently skip empty-message probe requests.
 * CopilotKit v1.55 sends these init/sync probes before any user message exists;
 * the Vercel AI SDK throws InvalidPromptError on empty message arrays.
 * Empty probes always have messages.length === 0.
 */
function guardedAdapter(base: CopilotServiceAdapter): CopilotServiceAdapter {
  return {
    ...base,
    async process(req: CopilotRuntimeChatCompletionRequest) {
      if (req.messages.length === 0) {
        // Complete the SSE stream immediately with no events so the client
        // receives a clean empty response instead of an error.
        await req.eventSource.stream(async (es) => {
          es.complete();
        });
        return { threadId: req.threadId ?? "" };
      }
      return base.process(req);
    },
  };
}

const runtime = new CopilotRuntime({
  actions: [
    // ── Backend tool: query analytics data ──────────────────────────────────
    {
      name: "run_analytics_query",
      description: `Execute a read-only SQL query against the user's analytics database. Available schema:\n${SCHEMA_DESCRIPTION}`,
      parameters: [
        {
          name: "sql",
          type: "string" as const,
          description:
            "A read-only SELECT or WITH SQL query. Do not include INSERT, UPDATE, DELETE, or DDL statements.",
          required: true,
        },
        {
          name: "purpose",
          type: "string" as const,
          description: "A brief description of what this query is trying to answer.",
          required: true,
        },
      ],
      handler: async ({ sql }: { sql: string; purpose: string }) => {
        const result = await runAnalyticsQuery({ sql });
        return result;
      },
    },

    // ── Backend tool: render a dashboard ────────────────────────────────────
    // Defined server-side so the AnthropicAdapter can resolve the tool call
    // within its streaming loop (no MissingToolResultsError).
    // The actual React rendering is handled client-side by useRenderToolCall
    // in useDashboardAction.tsx via useLazyToolRenderer in useCopilotChatInternal.
    {
      name: "render_dashboard",
      description:
        "Render an analytics dashboard from a JSON layout tree. Call this AFTER gathering all required data with run_analytics_query. The frontend will display the dashboard inline in the chat.",
      parameters: [
        {
          name: "dashboard",
          type: "object" as const,
          description:
            "Dashboard spec: { title?: string, description?: string, layout: LayoutNode }. See the system prompt for the full schema.",
          required: true,
        },
      ],
      handler: async (_args: { dashboard: unknown }) => {
        // The frontend's useRenderToolCall render() is what actually displays
        // this. The backend handler just needs to return so the AI can continue.
        return "Dashboard rendered on client.";
      },
    },
  ],
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: guardedAdapter(getServiceAdapter()),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
