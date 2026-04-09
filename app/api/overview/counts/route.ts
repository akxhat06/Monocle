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
    table:
      | "questions"
      | "errors"
      | "asr_logs"
      | "tts_logs"
      | "tool_calls",
    column: "created_at" = "created_at",
  ) => {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte(column, fromTs)
      .lte(column, toTs);
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  };

  try {
    const [
      usersRes,
      sessionsRes,
      questions,
      errors,
      asrLogs,
      ttsLogs,
      toolCalls,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", fromTs)
        .lte("last_seen", toTs),
      supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .gte("start_time", fromTs)
        .lte("start_time", toTs),
      countInRange("questions"),
      countInRange("errors"),
      countInRange("asr_logs"),
      countInRange("tts_logs"),
      countInRange("tool_calls"),
    ]);

    if (usersRes.error) throw new Error(`users: ${usersRes.error.message}`);
    if (sessionsRes.error) throw new Error(`sessions: ${sessionsRes.error.message}`);

    const counts: OverviewCounts = {
      users: usersRes.count ?? 0,
      sessions: sessionsRes.count ?? 0,
      questions,
      errors,
      asrLogs,
      ttsLogs,
      toolCalls,
    };

    return NextResponse.json({ from, to, counts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load counts";
    console.error("[overview/counts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
