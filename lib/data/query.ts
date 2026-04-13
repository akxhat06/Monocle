import db from "@/lib/db/postgres";
import { toJsonSafeDeep } from "@/lib/data/json-safe";

const BLOCKED = ["insert", "update", "delete", "drop", "alter", "truncate", "grant", "create", ";"];

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function isReadOnly(sql: string) {
  const s = sql.toLowerCase();
  const startsValid = s.startsWith("select") || s.startsWith("with");
  if (!startsValid) return false;
  return !BLOCKED.some((t) => s.includes(t));
}

function addLimit(sql: string, limit = 5000) {
  if (/\blimit\b/i.test(sql)) return sql;
  return `${sql} LIMIT ${limit}`;
}

export async function runAnalyticsQuery({ sql }: { sql: string }) {
  const cleaned = normalizeSql(sql);

  if (!isReadOnly(cleaned)) {
    return { error: "Only read-only SELECT/WITH queries are allowed." };
  }

  if (/\b(auth\.|pg_|information_schema\.)/i.test(cleaned)) {
    return { error: "Query touches blocked schemas." };
  }

  const finalSql = addLimit(cleaned);

  try {
    // postgres.js returns typed rows; cast to generic records for the LLM
    const rows = await db.unsafe(finalSql) as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return toJsonSafeDeep({
      rows,
      rowCount: rows.length,
      columns,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
