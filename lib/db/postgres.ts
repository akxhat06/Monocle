import postgres from "postgres";

declare global {
  // Prevents multiple connections in Next.js hot-reload (dev mode)
  // eslint-disable-next-line no-var
  var __analyticsDb: ReturnType<typeof postgres> | undefined;
}

function createDb() {
  const connectionString = process.env.ANALYTICS_DATABASE_URL;
  if (!connectionString) {
    throw new Error("ANALYTICS_DATABASE_URL environment variable is not set.");
  }
  return postgres(connectionString, {
    max: 5,              // connection pool size
    idle_timeout: 30,    // close idle connections after 30s
    connect_timeout: 10, // fail fast if DB unreachable
  });
}

// Reuse the connection pool across hot-reloads in dev
const db = globalThis.__analyticsDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalThis.__analyticsDb = db;

export default db;
