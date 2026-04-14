import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  EmptyAdapter,
} from "@copilotkit/runtime";
// BuiltInAgent and defineTool live in the v2 subpath (in package.json exports map)
import { BuiltInAgent, defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";
import { getServiceAdapter } from "@/lib/llm";
import { runAnalyticsQuery } from "@/lib/data/query";
import { SCHEMA_DESCRIPTION, SYSTEM_PROMPT } from "@/lib/prompts/system";

// ── Tool definitions ──────────────────────────────────────────────────────────
// Tools are defined directly on BuiltInAgent so `execute` is actually called.
// The CopilotRuntime `actions` path wires tools as `execute: () => Promise.resolve()`
// (empty stub), meaning tool results are always null — that's why we bypass it.

const runAnalyticsQueryTool = defineTool({
  name: "run_analytics_query",
  description: `Execute a read-only SQL query against the user's analytics database. Available schema:\n${SCHEMA_DESCRIPTION}`,
  parameters: z.object({
    sql: z.string().describe(
      "A read-only SELECT or WITH SQL query. Do not include INSERT, UPDATE, DELETE, or DDL statements.",
    ),
    purpose: z.string().describe(
      "A brief description of what this query is trying to answer.",
    ),
  }),
  execute: async ({ sql }) => {
    return await runAnalyticsQuery({ sql });
  },
});

const renderDashboardTool = defineTool({
  name: "render_dashboard",
  description:
    "Render an analytics dashboard from a JSON layout tree. Call this AFTER gathering all required data with run_analytics_query.",
  parameters: z.object({
    dashboard: z
      .record(z.unknown())
      .describe("Dashboard spec: { title?, description?, layout: LayoutNode }."),
  }),
  execute: async (_args) => {
    // Rendering happens client-side via useRenderToolCall; server just acknowledges
    return "Dashboard rendered on client.";
  },
});

// ── Runtime singleton ─────────────────────────────────────────────────────────
// maxSteps > 1 is required for the agentic loop:
//   step 1 → run_analytics_query (fetch data, possibly parallel)
//   step 2 → render_dashboard (build layout JSON from results)
//   step 3 → final one-sentence assistant text
// The default maxSteps=1 ends the run after step 1, so render_dashboard is never called.
function buildRuntime() {
  const serviceAdapter = getServiceAdapter();
  const model = serviceAdapter.getLanguageModel();

  const agent = new BuiltInAgent({
    model,
    maxSteps: 10,
    prompt: SYSTEM_PROMPT,
    tools: [runAnalyticsQueryTool, renderDashboardTool],
  });

  return new CopilotRuntime({
    agents: { default: agent },
  });
}

// Singleton — built once per server process
const runtime = buildRuntime();

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeEndpoint() {
  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    // serviceAdapter is optional when agents are provided directly;
    // EmptyAdapter satisfies the type without creating a conflicting BuiltInAgent
    serviceAdapter: new EmptyAdapter(),
    endpoint: "/api/copilotkit",
  });
}

type AgUiMessage = { role?: string; content?: string | unknown[] };

function hasRealUserMessage(messages: AgUiMessage[]): boolean {
  return messages.some((m) => {
    if (String(m.role ?? "").toLowerCase() !== "user") return false;
    const text =
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? (m.content as Array<{ text?: string }>).map((p) => p.text ?? "").join("")
          : "";
    return Boolean(text.trim());
  });
}

// ── POST — all CopilotKit requests (runs, info, connect) ─────────────────────
export const POST = async (req: Request) => {
  let bodyText = "";
  try { bodyText = await req.text(); } catch { /* ignore */ }

  // The AG-UI body format is:
  //   { method: "agent/run", params: { agentId: "..." }, body: { messages: [...], ... } }
  // Messages live under body.body.messages — NOT body.messages.
  type OuterBody = {
    method?: string;
    params?: { agentId?: string };
    body?: { messages?: AgUiMessage[]; threadId?: string; runId?: string; [k: string]: unknown };
  };

  let outer: OuterBody = {};
  try { outer = JSON.parse(bodyText) as OuterBody; } catch { /* fall through */ }

  const innerBody = outer.body ?? {};
  const messages: AgUiMessage[] = innerBody.messages ?? [];
  const method = outer.method ?? "";

  // "info" requests fetch runtime metadata (tools, version) — always forward
  const isInfoRequest = method === "info";
  // "agent/connect" and empty-message runs are probes
  const isProbe = !isInfoRequest && (method === "agent/connect" || !hasRealUserMessage(messages));

  console.log(
    `[copilotkit] POST method="${method}" msgs=${messages.length} probe=${isProbe}`,
    messages.slice(0, 2).map((m) => `role=${m.role} "${String(m.content ?? "").slice(0, 60)}"`),
  );

  if (isProbe) {
    const threadId = innerBody.threadId ?? "";
    const runId   = innerBody.runId   ?? "";

    console.log("[copilotkit] >>> PROBE — returning RUN_FINISHED");

    const sse = [
      `data: ${JSON.stringify({ type: "RUN_STARTED",  threadId, runId, input: innerBody })}\n\n`,
      `data: ${JSON.stringify({ type: "RUN_FINISHED", threadId, runId })}\n\n`,
    ].join("");

    return new Response(sse, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  console.log("[copilotkit] >>> REAL MESSAGE — forwarding to AI");

  const { handleRequest } = makeEndpoint();
  return handleRequest(
    new Request(req.url, { method: "POST", headers: req.headers, body: bodyText }),
  );
};
