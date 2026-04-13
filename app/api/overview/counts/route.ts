import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/db/postgres";
import type { OverviewCounts } from "@/lib/overview/types";

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
  // Auth check via Supabase (auth only)
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
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

  const fromTs = `${from}T00:00:00.000Z`;
  const toTs = `${to}T23:59:59.999Z`;

  try {
    // Single query fetches all counts at once — much faster than 14 round-trips
    const [row] = await db`
      SELECT
        (SELECT count(*)::int FROM users)                                                        AS users_total,
        (SELECT count(*)::int FROM users WHERE last_seen BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS users_active,
        (SELECT count(*)::int FROM sessions)                                                     AS sessions_total,
        (SELECT count(*)::int FROM sessions WHERE start_time BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS sessions_in_range,
        (SELECT count(*)::int FROM questions)                                                    AS questions_total,
        (SELECT count(*)::int FROM questions WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS questions_in_range,
        (SELECT count(*)::int FROM errors)                                                       AS errors_total,
        (SELECT count(*)::int FROM errors WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz)   AS errors_in_range,
        (SELECT count(*)::int FROM asr_logs)                                                     AS asr_total,
        (SELECT count(*)::int FROM asr_logs WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS asr_in_range,
        (SELECT count(*)::int FROM tts_logs)                                                     AS tts_total,
        (SELECT count(*)::int FROM tts_logs WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS tts_in_range,
        (SELECT count(*)::int FROM tool_calls)                                                   AS tool_total,
        (SELECT count(*)::int FROM tool_calls WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz) AS tool_in_range
    ` as Record<string, number>[];

    const counts: OverviewCounts = {
      users: row.users_total,
      usersActiveInRange: row.users_active,
      sessions: row.sessions_total,
      sessionsInRange: row.sessions_in_range,
      questions: row.questions_total,
      questionsInRange: row.questions_in_range,
      errors: row.errors_total,
      errorsInRange: row.errors_in_range,
      asrLogs: row.asr_total,
      asrLogsInRange: row.asr_in_range,
      ttsLogs: row.tts_total,
      ttsLogsInRange: row.tts_in_range,
      toolCalls: row.tool_total,
      toolCallsInRange: row.tool_in_range,
    };

    return NextResponse.json({ from, to, counts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load counts";
    console.error("[overview/counts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
