export const SCHEMA_DESCRIPTION = `
Use only tables in public schema.
Example tables:
- orders(id uuid, user_id uuid, amount_cents bigint, region text, created_at timestamptz)
- revenue_daily(day date, user_id uuid, revenue_cents bigint)
Conventions:
- Amounts are in cents; divide by 100 for display.
- The database is automatically scoped to the current user through Row Level Security.
- Do not query auth.*, pg_*, information_schema.*.
`;
