import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  type CopilotServiceAdapter,
  type CopilotRuntimeChatCompletionRequest,
} from "@copilotkit/runtime";
import { getServiceAdapter } from "@/lib/llm";
import { runAnalyticsQuery } from "@/lib/data/query";
import { SCHEMA_DESCRIPTION } from "@/lib/prompts/system";

type GuardedProcess = (req: CopilotRuntimeChatCompletionRequest) => Promise<{ threadId: string }>;

/**
 * Patch the adapter's process() method IN-PLACE so every call path
 * (including CopilotKit-internal retries and suggestion runs) goes through
 * the guard — not just the one we return from the factory.
 *
 * The { ...base, process: fn } spread approach only creates a new object;
 * CopilotKit's runtime can still hold a reference to base.process directly
 * and call it without going through our wrapper, causing InvalidPromptError
 * when probe/init requests with empty messages reach the AI SDK.
 */
function guardedAdapter(base: CopilotServiceAdapter): CopilotServiceAdapter {
  const originalProcess: GuardedProcess = base.process.bind(base);

  const completeStream = async (req: CopilotRuntimeChatCompletionRequest) => {
    try {
      await req.eventSource.stream(async (es) => {
        // RuntimeEventSubject extends ReplaySubject — complete() closes the stream
        (es as unknown as { complete(): void }).complete();
      });
    } catch {
      /* ignore stream errors */
    }
  };

  const guarded: GuardedProcess = async (req) => {
    // Only call the AI when there is a real, non-empty user message.
    // Probe/init requests have no user messages (or empty content).
    //
    // NOTE: do NOT check msg.type === "TextMessage" here.
    // AG-UI format messages have NO type field — checking it would incorrectly
    // classify real user messages as probes and silently swallow them.
    type MaybeMsg = { role?: string; content?: unknown };
    const hasRealUserMsg = req.messages.some((m) => {
      const msg = m as MaybeMsg;
      if (msg.role !== "user") return false;
      // content can be a string or content-part array
      const text =
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
            ? (msg.content as Array<{ text?: string }>)
                .map((p) => p.text ?? "")
                .join("")
            : "";
      return Boolean(text.trim());
    });

    if (!hasRealUserMsg) {
      await completeStream(req);
      return { threadId: req.threadId ?? "" };
    }

    try {
      return await originalProcess(req);
    } catch (err: unknown) {
      const name = (err as { name?: string } | null)?.name ?? "";
      if (name === "AI_InvalidPromptError" || name === "InvalidPromptError") {
        await completeStream(req);
        return { threadId: req.threadId ?? "" };
      }
      throw err;
    }
  };

  // Patch in-place: this replaces process() on the instance so any internal
  // CopilotKit call that reaches base.process also hits our guard.
  (base as unknown as { process: GuardedProcess }).process = guarded;

  return base;
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
