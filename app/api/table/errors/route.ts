import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/db/postgres";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from   = searchParams.get("from")  ?? "2026-02-17";
  const to     = searchParams.get("to")    ?? new Date().toISOString().slice(0, 10);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
  const search = searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;

  const fromTs = `${from}T00:00:00`;
  const toTs   = `${to}T23:59:59`;

  try {
    const [{ total }] = await db`
      SELECT count(*)::int AS total
      FROM errordetails
      WHERE created_at BETWEEN ${fromTs}::timestamp AND ${toTs}::timestamp
        ${search ? db`AND (errortext ILIKE ${"%" + search + "%"} OR uid ILIKE ${"%" + search + "%"})` : db``}
    ` as { total: number }[];

    const rows = await db`
      SELECT
        id,
        uid,
        sid,
        channel,
        errortext,
        created_at
      FROM errordetails
      WHERE created_at BETWEEN ${fromTs}::timestamp AND ${toTs}::timestamp
        ${search ? db`AND (errortext ILIKE ${"%" + search + "%"} OR uid ILIKE ${"%" + search + "%"})` : db``}
      ORDER BY created_at DESC
      LIMIT  ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({ page, limit, total, rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    console.error("[table/errors]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
