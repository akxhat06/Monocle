import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.rpc("run_safe_query", { query_sql: finalSql });

  if (error) {
    return { error: error.message };
  }

  const rows = Array.isArray(data) ? data : [];
  const columns = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];

  return {
    rows,
    rowCount: rows.length,
    columns
  };
}
