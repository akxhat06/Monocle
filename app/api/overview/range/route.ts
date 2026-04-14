import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import db from "@/lib/db/postgres";

/** Returns the actual earliest and latest dates that have data in the DB. */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [row] = await db`
      SELECT
        to_char(MIN(start_datetime), 'YYYY-MM-DD') AS earliest,
        to_char(MAX(start_datetime), 'YYYY-MM-DD') AS latest
      FROM calls
      WHERE is_debug_call = false
    ` as { earliest: string | null; latest: string | null }[];

    return NextResponse.json({
      earliest: row?.earliest ?? null,
      latest:   row?.latest   ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    console.error("[overview/range]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
