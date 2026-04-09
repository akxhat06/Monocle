import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OverviewCounts } from "@/lib/overview/types";

function toDayStartIso(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

function toDayEndIso(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return { from: fmt(from), to: fmt(to) };
}

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const defaults = defaultRange();
  const fromParam = searchParams.get("from")?.slice(0, 10);
  const toParam = searchParams.get("to")?.slice(0, 10);
  const from = fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : defaults.from;
  const to = toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam) ? toParam : defaults.to;

  if (from > to) {
    return NextResponse.json({ error: "Invalid range: from must be before to" }, { status: 400 });
  }

  const fromTs = toDayStartIso(from);
  const toTs = toDayEndIso(to);

  const countInRange = async (
    table: "questions" | "errors" | "asr_logs" | "tts_logs" | "tool_calls",
    column: "created_at" = "created_at",
  ) => {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte(column, fromTs)
      .lte(column, toTs);
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  };

  try {
    const [
      usersTotalRes,
      usersActiveRes,
      sessionsTotalRes,
      sessionsInRangeRes,
      questionsTotalRes,
      questionsInRange,
      errorsTotalRes,
      errorsInRange,
      asrTotalRes,
      asrInRange,
      ttsTotalRes,
      ttsInRange,
      toolTotalRes,
      toolInRange,
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("last_seen", fromTs)
        .lte("last_seen", toTs),
      supabase.from("sessions").select("session_id", { count: "exact", head: true }),
      supabase
        .from("sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("start_time", fromTs)
        .lte("start_time", toTs),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      countInRange("questions"),
      supabase.from("errors").select("id", { count: "exact", head: true }),
      countInRange("errors"),
      supabase.from("asr_logs").select("id", { count: "exact", head: true }),
      countInRange("asr_logs"),
      supabase.from("tts_logs").select("id", { count: "exact", head: true }),
      countInRange("tts_logs"),
      supabase.from("tool_calls").select("id", { count: "exact", head: true }),
      countInRange("tool_calls"),
    ]);

    if (usersTotalRes.error) throw new Error(`users: ${usersTotalRes.error.message}`);
    if (usersActiveRes.error) throw new Error(`users (active): ${usersActiveRes.error.message}`);
    if (sessionsTotalRes.error) throw new Error(`sessions (total): ${sessionsTotalRes.error.message}`);
    if (sessionsInRangeRes.error) throw new Error(`sessions: ${sessionsInRangeRes.error.message}`);
    if (questionsTotalRes.error) throw new Error(`questions (total): ${questionsTotalRes.error.message}`);
    if (errorsTotalRes.error) throw new Error(`errors (total): ${errorsTotalRes.error.message}`);
    if (asrTotalRes.error) throw new Error(`asr_logs (total): ${asrTotalRes.error.message}`);
    if (ttsTotalRes.error) throw new Error(`tts_logs (total): ${ttsTotalRes.error.message}`);
    if (toolTotalRes.error) throw new Error(`tool_calls (total): ${toolTotalRes.error.message}`);

    const counts: OverviewCounts = {
      users: usersTotalRes.count ?? 0,
      usersActiveInRange: usersActiveRes.count ?? 0,
      sessions: sessionsTotalRes.count ?? 0,
      sessionsInRange: sessionsInRangeRes.count ?? 0,
      questions: questionsTotalRes.count ?? 0,
      questionsInRange,
      errors: errorsTotalRes.count ?? 0,
      errorsInRange,
      asrLogs: asrTotalRes.count ?? 0,
      asrLogsInRange: asrInRange,
      ttsLogs: ttsTotalRes.count ?? 0,
      ttsLogsInRange: ttsInRange,
      toolCalls: toolTotalRes.count ?? 0,
      toolCallsInRange: toolInRange,
    };

    return NextResponse.json({ from, to, counts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load counts";
    console.error("[overview/counts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
