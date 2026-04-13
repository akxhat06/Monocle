import { runAnalyticsQuery } from "@/lib/data/query";
import { toJsonSafeDeep } from "@/lib/data/json-safe";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sql?: string };
    const sql = (body.sql || "").trim();

    if (!sql) {
      return Response.json({ error: "sql is required" }, { status: 400 });
    }

    const result = await runAnalyticsQuery({ sql });
    if ("error" in result) {
      return Response.json(toJsonSafeDeep(result), { status: 400 });
    }

    return Response.json(toJsonSafeDeep(result));
  } catch {
    return Response.json({ error: "Failed to run analytics query" }, { status: 500 });
  }
}
