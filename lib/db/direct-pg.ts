import { Pool, type QueryResult } from "pg";

const globalForPool = globalThis as unknown as { __monocle_pg_pool?: Pool };

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  return url || undefined;
}

export function isDirectPostgresEnabled(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getPgPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;

  if (!globalForPool.__monocle_pg_pool) {
    globalForPool.__monocle_pg_pool = new Pool({ connectionString, max: 10 });
  }
  return globalForPool.__monocle_pg_pool;
}

export function rowsFromPgResult(result: QueryResult): {
  rows: Record<string, unknown>[];
  columns: string[];
} {
  const rows = result.rows as Record<string, unknown>[];
  const columns =
    result.fields?.length > 0
      ? result.fields.map((f) => f.name)
      : rows[0]
        ? Object.keys(rows[0])
        : [];
  return { rows, columns };
}
