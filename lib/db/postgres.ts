import postgres from "postgres";

declare global {
  // Prevents multiple connections in Next.js hot-reload (dev mode)
  // eslint-disable-next-line no-var
  var __analyticsDb: ReturnType<typeof postgres> | undefined;
}

function createDb() {
  // Support both the Supabase-standard DATABASE_URL and the legacy ANALYTICS_DATABASE_URL.
  // Get your Supabase connection string from:
  //   Supabase Dashboard → Settings → Database → Connection string → URI
  // Use the "Transaction Pooler" URL (port 6543) for serverless / Next.js.
  const connectionString =
    process.env.ANALYTICS_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "No database connection string found. " +
      "Set ANALYTICS_DATABASE_URL (or DATABASE_URL) to your Supabase connection string. " +
      "Find it at: Supabase Dashboard → Settings → Database → Connection string (URI)."
    );
  }

  return postgres(connectionString, {
    max: 5,              // pool size — keep low for Supabase free tier
    idle_timeout: 30,    // close idle connections after 30s
    connect_timeout: 10, // fail fast if unreachable
    // Supabase's Transaction Pooler requires prepare: false
    prepare: false,
  });
}

// Reuse the connection pool across hot-reloads in dev
const db = globalThis.__analyticsDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalThis.__analyticsDb = db;

export default db;
