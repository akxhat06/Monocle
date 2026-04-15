import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/db/postgres";

const ALL_TIME_SENTINEL = "2000-01-01";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from") ?? ALL_TIME_SENTINEL;
  const to        = searchParams.get("to")   ?? new Date().toISOString().slice(0, 10);

  let from = fromParam;
  if (fromParam === ALL_TIME_SENTINEL) {
    try {
      const [earliest] = await db`
        SELECT to_char(MIN(start_datetime), 'YYYY-MM-DD') AS d FROM calls WHERE is_debug_call = false
      ` as { d: string | null }[];
      if (earliest?.d) from = earliest.d;
    } catch { /* fall back */ }
  }

  const fromTs = `${from}T00:00:00.000Z`;
  const toTs   = `${to}T23:59:59.999Z`;

  const days = Math.ceil(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
  );
  const bucket = days <= 14 ? "day" : days <= 90 ? "week" : "month";

  try {
    const rows = await db`
      SELECT
        date_trunc(${bucket}, gs.d)::date AS day,
        COALESCE(c.calls,     0) AS calls,
        COALESCE(q.questions, 0) AS questions,
        COALESCE(e.errors,    0) AS errors,
        COALESCE(a.asr,       0) AS asr,
        COALESCE(t.tts,       0) AS tts,
        COALESCE(u.users,     0) AS users
      FROM generate_series(
        ${fromTs}::timestamptz,
        ${toTs}::timestamptz,
        ('1 ' || ${bucket})::interval
      ) AS gs(d)
      LEFT JOIN (
        SELECT date_trunc(${bucket}, start_datetime)::date AS d, count(*)::int AS calls
        FROM calls
        WHERE start_datetime BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
          AND is_debug_call = false
        GROUP BY 1
      ) c ON c.d = date_trunc(${bucket}, gs.d)::date
      LEFT JOIN (
        SELECT date_trunc(${bucket}, created_at)::date AS d, count(*)::int AS questions
        FROM questions
        WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
        GROUP BY 1
      ) q ON q.d = date_trunc(${bucket}, gs.d)::date
      LEFT JOIN (
        SELECT date_trunc(${bucket}, created_at)::date AS d, count(*)::int AS errors
        FROM errordetails
        WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
        GROUP BY 1
      ) e ON e.d = date_trunc(${bucket}, gs.d)::date
      LEFT JOIN (
        SELECT date_trunc(${bucket}, created_at)::date AS d, count(*)::int AS asr
        FROM asr_details
        WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
        GROUP BY 1
      ) a ON a.d = date_trunc(${bucket}, gs.d)::date
      LEFT JOIN (
        SELECT date_trunc(${bucket}, created_at)::date AS d, count(*)::int AS tts
        FROM tts_details
        WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
        GROUP BY 1
      ) t ON t.d = date_trunc(${bucket}, gs.d)::date
      LEFT JOIN (
        SELECT date_trunc(${bucket}, created_at)::date AS d, count(*)::int AS users
        FROM users
        WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
        GROUP BY 1
      ) u ON u.d = date_trunc(${bucket}, gs.d)::date
      ORDER BY day
    ` as { day: string; calls: number; questions: number; errors: number; asr: number; tts: number; users: number }[];

    // Strip leading all-zero rows
    let start = 0;
    while (
      start < rows.length - 1 &&
      rows[start].calls === 0 && rows[start].questions === 0 &&
      rows[start].errors === 0 && rows[start].asr === 0 &&
      rows[start].tts === 0 && rows[start].users === 0
    ) { start++; }

    return NextResponse.json({ bucket, rows: rows.slice(start) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[overview/trend]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
