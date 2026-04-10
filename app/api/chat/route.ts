import Anthropic from "@anthropic-ai/sdk";
import { runAnalyticsQuery } from "@/lib/data/query";
import { SCHEMA_DESCRIPTION } from "@/lib/data/schema";

type ChatBody = {
  message?: string;
  greeting?: boolean;
};

const GREETING_SYSTEM =
  "You are Monocle AI, a warm analytics copilot. When greeted, respond briefly and friendly (1-2 sentences), invite the user to ask an analytics question, and keep tone natural like ChatGPT/Claude.";

const ANALYTICS_SYSTEM =
  "You are Monocle AI, an analytics assistant for data analysts. Be concise and action-oriented. For analytics questions, provide direct answers with metric-first wording and minimal explanation text. Do not give generic 'I don't have access' disclaimers. If data is unavailable, say so briefly and ask one concrete follow-up.";

const SQL_PLANNER_SYSTEM = `You create a single read-only SQL query for the user's analytics question.
Return JSON only with this exact shape:
{"sql":"SELECT ...","purpose":"..."}
Rules:
- Read-only SELECT/WITH only.
- Prefer aggregate SQL and short result sets.
- Use only this schema:
${SCHEMA_DESCRIPTION}
`;

function resolveAnthropicModel() {
  const configuredRaw = (process.env.ANTHROPIC_MODEL || "").trim();
  const configured = configuredRaw.replace(/^['"]|['"]$/g, "");
  const unsupported = new Set([
    "claude-sonnet-4-20250514",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-20251001",
  ]);
  if (!configured || unsupported.has(configured)) {
    return "claude-3-5-sonnet-latest";
  }
  return configured;
}

function sanitizePlannedSql(input: string) {
  let sql = input.trim();
  sql = sql.replace(/^```sql\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  sql = sql.replace(/;+\s*$/g, "");
  return sql.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatBody;
    const message = (body.message || "").trim();
    if (!message) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Anthropic API key is not configured." }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Greeting path: plain conversational response.
          if (body.greeting) {
            const anthropicStream = await client.messages.create({
              model: resolveAnthropicModel(),
              max_tokens: 280,
              system: GREETING_SYSTEM,
              messages: [{ role: "user", content: message }],
              stream: true,
            });

            let wroteAnyToken = false;
            for await (const event of anthropicStream) {
              if (event.type !== "content_block_delta") continue;
              if (event.delta.type !== "text_delta") continue;
              const token = event.delta.text || "";
              if (!token) continue;
              wroteAnyToken = true;
              controller.enqueue(encoder.encode(token));
            }

            if (!wroteAnyToken) {
              controller.enqueue(encoder.encode("How can I help with your analytics today?"));
            }
            controller.close();
            return;
          }

          // Analytics path: plan SQL -> run DB query -> summarize.
          const plan = await client.messages.create({
            model: resolveAnthropicModel(),
            max_tokens: 220,
            system: SQL_PLANNER_SYSTEM,
            messages: [{ role: "user", content: message }],
          });
          const rawPlan = plan.content
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n")
            .trim();
          const jsonMatch = rawPlan.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            controller.enqueue(
              encoder.encode("I could not build a valid query. Please rephrase with the metric and date range."),
            );
            controller.close();
            return;
          }

          const parsed = JSON.parse(jsonMatch[0]) as { sql?: string; purpose?: string };
          if (!parsed.sql) {
            controller.enqueue(
              encoder.encode("I could not build a SQL query. Please ask with more detail."),
            );
            controller.close();
            return;
          }

          const sanitizedSql = sanitizePlannedSql(parsed.sql);
          const queryResult = await runAnalyticsQuery({ sql: sanitizedSql });
          if ("error" in queryResult) {
            controller.enqueue(
              encoder.encode(
                `I ran a data query but it failed: ${queryResult.error}. Please confirm the metric/table name and date field.`,
              ),
            );
            controller.close();
            return;
          }

          const summaryPrompt = `User question: ${message}
Purpose: ${parsed.purpose || "analytics query"}
Rows: ${JSON.stringify(queryResult.rows).slice(0, 5000)}
Row count: ${queryResult.rowCount}
Columns: ${queryResult.columns.join(", ")}

Respond in 1-3 short lines. Lead with the key metric/value, then one concise insight.`;

          const anthropicStream = await client.messages.create({
            model: resolveAnthropicModel(),
            max_tokens: 280,
            system: ANALYTICS_SYSTEM,
            messages: [{ role: "user", content: summaryPrompt }],
            stream: true,
          });

          let wroteAnyToken = false;
          for await (const event of anthropicStream) {
            if (event.type !== "content_block_delta") continue;
            if (event.delta.type !== "text_delta") continue;
            const token = event.delta.text || "";
            if (!token) continue;
            wroteAnyToken = true;
            controller.enqueue(encoder.encode(token));
          }

          if (!wroteAnyToken) {
            controller.enqueue(encoder.encode("How can I help with your analytics today?"));
          }
        } catch {
          controller.enqueue(encoder.encode("I could not process that right now. Please try again."));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache, no-transform",
      },
    });
  } catch {
    return Response.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
