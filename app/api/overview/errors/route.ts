import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/db/postgres";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "2000-01-01";
  const to   = searchParams.get("to")   ?? new Date().toISOString().slice(0, 10);
  const fromTs = `${from}T00:00:00.000Z`;
  const toTs   = `${to}T23:59:59.999Z`;

  try {
    const rows = await db`
      SELECT
        errortext AS error,
        count(*)::int AS count
      FROM errordetails
      WHERE created_at BETWEEN ${fromTs}::timestamptz AND ${toTs}::timestamptz
      GROUP BY errortext
      ORDER BY count DESC
      LIMIT 8
    ` as { error: string; count: number }[];

    return NextResponse.json({ rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[overview/errors]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
