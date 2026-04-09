# Lumen — Conversational Analytics Dashboard

**A Next.js app where users ask questions in natural language and get a fully-formed analytics dashboard back, designed at query time by an LLM, rendered from real Supabase data.**

---

## 1. Goal

Build a single Next.js application where:

- A user signs in with Supabase Auth.
- They type an analytics question (e.g. *"Give me a sales overview for last month"*).
- An LLM (Anthropic **or** OpenAI, swappable via config — never both in parallel) interprets the question.
- The LLM queries the user's Supabase Postgres database via a server-side tool, with Row Level Security enforcing data isolation automatically.
- The LLM designs an arbitrary dashboard layout from a typed schema of widgets and containers.
- The frontend renders that layout as a real, interactive dashboard inline in the chat and on a persistent canvas.

The UI is **not** restricted to a fixed set of dashboard types. The LLM decides the shape of the dashboard at query time, using a composable schema of primitives the app provides.

---

## 2. Architecture decision

**Single Next.js 14 app (App Router). Supabase as the unified auth + database backend. No separate service.**

- Frontend and backend (CopilotKit AG-UI runtime) live in the same Next.js process.
- API route `/api/copilotkit` runs the runtime, which speaks AG-UI to the frontend.
- LLM provider is selected at request time via environment variable (or cookie for live A/B), using a thin adapter layer.
- Supabase provides:
  - **Auth** — email/password, magic link, OAuth providers (Google, GitHub, etc.)
  - **Postgres** — the analytics database the LLM queries
  - **Row Level Security (RLS)** — per-user data isolation enforced at the database layer
  - **SSR session helpers** via `@supabase/ssr` for Next.js App Router
- Database access from the runtime uses a **per-request Supabase client bound to the user's JWT**, so RLS policies fire automatically. The LLM can never escape the current user's data scope.

**Monorepo is deferred.** Promote to a Turborepo only if a Python agent framework (Pydantic AI, LangGraph) becomes necessary, or if chart components need to be shared across multiple frontends.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) |
| Database | Supabase Postgres |
| Data isolation | Supabase Row Level Security policies |
| AG-UI client | `@copilotkit/react-core`, `@copilotkit/react-ui` |
| AG-UI runtime | `@copilotkit/runtime` |
| LLM SDKs | `@anthropic-ai/sdk`, `openai` |
| Charts | Tremor (analytics primitives) + Recharts where needed |
| Validation | Zod (shared between server tools and frontend renderer) |
| State | Zustand (dashboard canvas store) |
| Styling | Tailwind |

---

## 4. Repo structure

```
lumen/
├── app/
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts              # CopilotKit runtime (AG-UI server)
│   ├── auth/
│   │   ├── login/page.tsx            # Supabase login UI
│   │   ├── callback/route.ts         # OAuth callback handler
│   │   └── signout/route.ts
│   ├── layout.tsx                    # <CopilotKit> + Supabase session provider
│   ├── middleware.ts                 # Supabase session refresh + route protection
│   └── (app)/
│       └── page.tsx                  # Dashboard canvas + <CopilotChat> (auth required)
├── components/
│   ├── DashboardRenderer.tsx         # Recursive renderer for the dashboard tree
│   ├── DashboardSkeleton.tsx
│   ├── widgets/
│   │   ├── KpiCard.tsx
│   │   ├── BarChartWidget.tsx
│   │   ├── LineChartWidget.tsx
│   │   ├── AreaChartWidget.tsx
│   │   ├── PieChartWidget.tsx
│   │   ├── HeatmapWidget.tsx
│   │   ├── DataTableWidget.tsx
│   │   └── MarkdownWidget.tsx
│   └── actions/
│       └── useDashboardAction.tsx    # useCopilotAction for render_dashboard
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookies-bound, per request)
│   │   ├── service.ts                # Service-role client (admin only, never used in user paths)
│   │   └── middleware.ts             # Session refresh helper
│   ├── llm/
│   │   ├── index.ts                  # getServiceAdapter() — provider switch
│   │   ├── anthropic.ts
│   │   └── openai.ts
│   ├── data/
│   │   ├── query.ts                  # runAnalyticsQuery() with safety layers
│   │   └── schema.ts                 # SCHEMA_DESCRIPTION shown to the LLM
│   ├── schemas/
│   │   └── dashboard.ts              # Zod Dashboard schema (single source of truth)
│   └── prompts/
│       └── system.ts                 # System prompt for the analytics agent
├── supabase/
│   ├── migrations/                   # SQL migrations (analytics schema + RLS policies)
│   └── seed.sql                      # Seed data for development
├── store/
│   └── dashboard.ts                  # Zustand canvas store
├── .env.local
└── package.json
```

---

## 5. Supabase setup

### 5.1 Project provisioning

- Create a Supabase project. Note `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Enable the auth providers you want (email/password is the default; add Google or GitHub as needed).
- Add `http://localhost:3000` and your production URL to the auth redirect allowlist.

### 5.2 Three Supabase clients, three different scopes

The single most important rule for safety: **the right client must be used in the right place**.

| Client | File | Scope | Used by |
|---|---|---|---|
| **Browser** | `lib/supabase/client.ts` | Public anon key, runs in the browser | React components, login pages |
| **Server (per-request)** | `lib/supabase/server.ts` | Anon key + the **user's JWT from cookies** | Server components, the CopilotKit runtime, **the analytics query handler** |
| **Service-role** | `lib/supabase/service.ts` | Service-role key, **bypasses RLS** | Admin tasks only — migrations, internal jobs. **Never used in any code path the LLM can reach.** |

The CopilotKit runtime tool handler **must** use the per-request server client. That client carries the user's JWT, which means every query the LLM issues passes through Supabase RLS as that specific user. The service-role client is forbidden in any LLM-reachable path — using it there would let the LLM read every user's data.

### 5.3 Middleware for session refresh

`app/middleware.ts` uses `@supabase/ssr` to refresh the user's session on every request and gate `(app)` routes behind authentication. Unauthenticated requests get redirected to `/auth/login`.

### 5.4 Schema and migrations

Analytics tables live in the same Supabase Postgres instance as auth. Every analytics table that contains user-scoped data **must**:

1. Have a `user_id uuid not null references auth.users(id)` column (or `tenant_id` for multi-user orgs).
2. Have RLS enabled: `alter table <table> enable row level security;`
3. Have an explicit policy restricting access to the owner.

Example migration:

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  product_id uuid not null,
  amount_cents bigint not null,
  region text not null check (region in ('us', 'eu', 'apac')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "users read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Repeat for customers, products, revenue_daily, etc.
```

This is the foundation. With RLS in place, **a query like `SELECT * FROM orders` only returns the rows belonging to the authenticated user** — even if the LLM forgets a `WHERE` clause, the database enforces isolation. This is the killer feature of using Supabase here.

---

## 6. Provider switching (Anthropic ↔ OpenAI)

The whole point: same code, same tools, same UI. Only the adapter changes.

`lib/llm/index.ts` exposes `getServiceAdapter()` which reads `LLM_PROVIDER` from the environment (or a request cookie for live toggling) and returns either `AnthropicAdapter` or `OpenAIAdapter` from `@copilotkit/runtime`. The runtime hands the adapter to the request handler. The frontend never knows which provider answered.

This allows:

- Per-environment configuration (Anthropic in prod, OpenAI in staging, or vice versa).
- Live A/B testing via a cookie-backed UI toggle.
- Zero parallel execution — exactly one provider per request.

---

## 7. The two-tool pattern

The LLM is given two tools and chains them:

### Tool 1 — `run_analytics_query` (server-side, runs as the authenticated user)

- Defined in the CopilotKit runtime as a server action.
- Accepts `{ sql: string, purpose: string }`.
- Inside the handler:
  1. Get the per-request Supabase server client (already bound to the user's JWT via cookies).
  2. Validate the SQL with the safety layers below.
  3. Execute via a Supabase Postgres `rpc` call to a SQL-execution function (see §10).
  4. Return `{ rows, rowCount, columns }` as JSON, or `{ error }` on failure.
- Tool description embeds the curated `SCHEMA_DESCRIPTION` so the LLM knows what tables, columns, and conventions exist.
- **RLS does the per-user filtering.** The handler does *not* inject `WHERE user_id = ?`. It doesn't have to. The database enforces it.

### Tool 2 — `render_dashboard` (frontend-side)

- Defined via `useCopilotAction` in the React tree.
- Accepts a single `dashboard` object matching the Zod `Dashboard` schema.
- Its `render` function:
  - Shows a skeleton while `status !== "complete"`.
  - On completion, parses with Zod; on failure renders an error card.
  - On success, mounts `<DashboardRenderer />` inline in the chat.
  - Also pushes the dashboard tree into the Zustand canvas store so it pins on the persistent dashboard grid.

---

## 8. The dashboard schema (the heart of the app)

A single Zod `Dashboard` schema is the contract between the LLM and the frontend. It defines:

**Widgets** (leaf nodes — discriminated union on `type`):

- `kpi` — label, value, optional delta, format
- `bar` — title, data rows, xKey, yKeys[], orientation, stacked
- `line` — title, data rows, xKey, yKeys[], smooth
- `area` — title, data rows, xKey, yKeys[], stacked
- `pie` — title, data, donut
- `heatmap` — title, data (x, y, value)
- `table` — title, columns, rows
- `markdown` — content

**Containers** (recursive layout nodes):

- `row` — horizontal flex
- `col` — vertical flex
- `grid` — N-column grid

**Top-level**: `{ title, description?, layout: LayoutNode }` where `LayoutNode` is recursively `Widget | Container`.

This schema is **the single source of truth**. It generates TypeScript types for the renderer and is described to the LLM in the tool definition. Adding a new widget = one Zod variant + one case in the recursive renderer + a one-line update to the system prompt.

**Start small.** Six widgets (`kpi`, `bar`, `line`, `area`, `table`, `markdown`) and three containers (`row`, `col`, `grid`) is enough for v1. Resist expanding the schema until a real user question can't be answered with the current set.

---

## 9. The recursive renderer

`components/DashboardRenderer.tsx` is the only piece that knows how to turn the tree into pixels. It's a single switch statement on `node.type`:

- Container nodes (`row`, `col`, `grid`) recurse into children.
- Widget nodes mount their corresponding component from `components/widgets/`.

The design system (colors, spacing, typography, chart styling) lives entirely inside the widget components. The LLM picks **what** to show; the app controls **how it looks**.

---

## 10. Database safety with Supabase

The LLM writes SQL. With Supabase + RLS, the safety story is significantly stronger than with raw Postgres because **the database itself enforces per-user isolation** — but you still need every other layer.

### 10.1 The execution path

Supabase doesn't let you send arbitrary SQL through `supabase-js` directly. The clean path:

**Postgres function (`rpc`).** Create a SECURITY INVOKER function in Postgres that takes a SQL string and executes it. Call it from the handler via `supabase.rpc('run_safe_query', { query_sql: sql })`. Because it's `SECURITY INVOKER`, it runs as the authenticated user and RLS applies.

```sql
create or replace function public.run_safe_query(query_sql text)
returns jsonb
language plpgsql
security invoker  -- runs as the calling user, RLS applies
as $$
declare
  result jsonb;
begin
  -- Set a hard timeout for any query running through here
  set local statement_timeout = '10s';
  -- Validation already happened in the Next.js handler before this is called.
  -- This function is a thin executor.
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', query_sql)
    into result;
  return result;
end;
$$;

-- Restrict who can call it
revoke all on function public.run_safe_query from public;
grant execute on function public.run_safe_query to authenticated;
```

### 10.2 The validation layers (still required, on top of RLS)

RLS handles isolation, but it does **not** handle:

- Write protection (a malicious or confused LLM could try to `UPDATE` its own rows).
- Reading from tables you didn't intend to expose (e.g. `auth.users`).
- Cost protection (giant queries, row explosions, runaway joins).
- Schema discovery you don't want (`information_schema`, `pg_catalog`).

So `runAnalyticsQuery()` in `lib/data/query.ts` enforces, *before* calling the rpc:

1. **Read-only verification** — must start with `SELECT` or `WITH`, and must not contain `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `CREATE`, or `;` (no statement chaining). Use a real SQL parser (`node-sql-parser`) for production.
2. **Table allowlist** — a hardcoded `Set` of allowed table names in the `public` schema. Parse the SQL, extract referenced tables, reject anything not in the allowlist. Explicitly block `auth.*`, `pg_*`, `information_schema.*`.
3. **Row cap** — inject `LIMIT 5000` if absent.
4. **Statement timeout** — set in the `run_safe_query` function with `set local statement_timeout = '10s'`.
5. **Error feedback loop** — return errors to the LLM as `{ error: "..." }` so it can self-correct.

### 10.3 Why this is better than raw Postgres

With raw Postgres, *you* are responsible for injecting the user filter on every query. One missed `WHERE` clause and a user sees another user's data. With Supabase RLS, the **database** is the enforcement boundary. Even if the LLM writes `SELECT * FROM orders`, it gets only the authenticated user's rows. This is the killer reason to use Supabase here.

---

## 11. The schema description for the LLM

`lib/data/schema.ts` exports a hand-curated string describing the tables, columns, types, foreign keys, and conventions. It is embedded in the `run_analytics_query` tool description so it lands in every tool-calling prompt automatically. Include:

- Table names and columns with types.
- Foreign key relationships.
- Conventions (units, e.g. "amounts are in cents — divide by 100 for display").
- Hints about which views to prefer (e.g. "prefer `revenue_daily` over aggregating `orders` for time-series").
- Time-range conventions.
- **Importantly**: a note that the user only sees their own data (RLS), so the LLM should not try to add `WHERE user_id = ?` itself.

A CI check should compare this string against the live Supabase schema (via `supabase db dump` or introspection) and fail the build if they drift.

---

## 12. The system prompt

Lives in `lib/prompts/system.ts`. Most of the iteration on dashboard quality happens here. It must include:

- **Role**: "You are an analytics assistant. The user asks questions; you answer by querying their Supabase database and rendering dashboards."
- **Tool usage rules**: when to call `run_analytics_query`, how to chain queries before rendering, when to render the dashboard.
- **Data scope note**: "The database automatically filters to the current user's data via Row Level Security. Do not add `WHERE user_id = ?` clauses — they are unnecessary and will produce incorrect results."
- **Chart selection guidance**: explicit rules like *"Use line/area for time series. Use bar for categorical comparisons with ≤15 categories. Use pie only with ≤6 slices showing parts of a whole. Lead overviews with 3–5 KPI cards. Use tables for detail or when ≥5 columns matter."*
- **Layout guidance**: *"Overviews: KPI grid on top, 1–2 charts in the middle, optional table below. Single-question answers: one widget. Investigations: heatmap or stacked area + supporting table."*
- **Aggregation discipline**: *"Aggregate in SQL, not in your head. Return chart-ready row counts (typically 5–100 rows). Never embed thousands of raw rows in a render call."*
- **Examples** of good question → query plan → dashboard tree mappings.

---

## 13. Cost and performance discipline

- **Aggregate in SQL.** The single biggest cost lever. A monthly trend should return 12 rows, not 12,000.
- **Cap exploration queries** with `LIMIT 200` when the LLM is poking around.
- **Return summaries, not raw rows**, when row counts are high: `{ rowCount: 50000, sample: [first 20], aggregates: {...} }`.
- **Reference-by-ID for large datasets** (deferred): cache query results server-side keyed by ID, return only the ID + a small sample to the LLM, let `render_dashboard` reference `dataRef: "q_abc123"`. The renderer fetches by ID at mount time. Skip in v1.
- **Don't reach for the most expensive model.** Anthropic Sonnet and `gpt-4o` are right-sized. Reserve Opus or reasoning models for genuinely hard analytical questions.
- **Use Supabase materialized views** for expensive aggregations the LLM hits repeatedly (e.g. `revenue_daily`, `cohort_retention`). Refresh on a cron or trigger.

---

## 14. Build phases

1. **Supabase project setup** — create project, enable auth, add `@supabase/ssr` and `@supabase/supabase-js`, wire the three clients (browser, server, service-role), add session middleware.
2. **Auth flow** — login/signup pages, callback route, route protection in middleware. Verify a user can sign in and reach a protected page.
3. **Scaffold CopilotKit** — install, wire `<CopilotKit runtimeUrl="/api/copilotkit">` in layout, drop a `<CopilotChat>` on the protected page. Confirm the AG-UI event stream works end-to-end with a hardcoded Anthropic adapter.
4. **Provider switch** — extract `getServiceAdapter()`, add OpenAI adapter, flip via env var, test both.
5. **Analytics schema** — write Supabase migrations for the analytics tables, **enable RLS, write policies**, seed test data for your own user.
6. **`run_safe_query` rpc function** — create the SECURITY INVOKER Postgres function, grant execute to `authenticated`, test it from a server route.
7. **DB tool** — implement `runAnalyticsQuery()` in the handler with all validation layers, calling the rpc through the per-request Supabase server client. Verify RLS works by signing in as user A and confirming you can't see user B's data even with no `WHERE` clause.
8. **Schema description** — write `SCHEMA_DESCRIPTION`, wire it into the tool description, verify the LLM writes valid SQL.
9. **Dashboard schema** — define the Zod `Dashboard` schema with the v1 widget set.
10. **Recursive renderer** — build `DashboardRenderer.tsx` and the v1 widget components.
11. **`render_dashboard` action** — wire `useCopilotAction` with the `render` function. Test the full loop end-to-end with one real question.
12. **System prompt** — write v1, iterate against 10–20 representative test questions until chart selection and layout choices are consistently good.
13. **Dashboard canvas** — Zustand store; tool handler also pushes to the store so dashboards pin on a persistent grid.
14. **Polish** — loading skeletons, error cards, query result caching, partial-JSON streaming for long dashboards (optional).
15. **(Optional) provider toggle UI** — cookie-backed switch in the UI for live Anthropic vs OpenAI comparison.

---

## 15. Known gotchas

- **Wrong Supabase client in the runtime.** If the CopilotKit handler accidentally uses the service-role client, **RLS is bypassed and the LLM can read every user's data**. This is the single most important thing to get right. Add a lint rule, a code review checklist item, or wrap the service-role client in a module that throws if imported from `app/api/copilotkit/`.
- **RLS policies missing on a new table.** Adding a table without `enable row level security` and a policy means it's exposed. Add a CI check that scans the schema and fails if any `public` table has RLS disabled.
- **`auth.users` exposure.** Block `auth.*` in the table allowlist explicitly. The LLM should never query the auth schema.
- **Streaming partial JSON.** Tool args stream in deltas; mid-stream the dashboard JSON is invalid. Render a skeleton until `status === "complete"`, then parse with Zod.
- **Token cost of round-tripping rows.** Rows come back from `run_analytics_query`, then get re-emitted inside `render_dashboard` args — paid for twice. Aggregate hard in SQL.
- **Bad chart choices.** Fix in the system prompt with explicit rules and examples.
- **Schema validation rejecting near-valid output.** Use `.passthrough()` and forgiving defaults where appropriate.
- **Provider differences.** Claude tends to be conservative and verbose; GPT tends to omit optional fields. The Zod schema absorbs both.
- **Schema drift.** When you add or rename a column, update `SCHEMA_DESCRIPTION` and the relevant RLS policies in the same migration.
- **Don't run providers in parallel.** Doubles cost, complicates streaming, AG-UI is single-source by design.
- **Session refresh in middleware.** `@supabase/ssr` requires the middleware helper to be called on every request, otherwise sessions silently expire and the runtime gets a stale or missing JWT.

---

## 16. Future extensions

- **Save/share dashboards** — store the Zod tree in a `public.dashboards` table (with RLS) so users can save, version, and re-run them.
- **Editable dashboards** — let users tweak the LLM-generated layout (drag widgets, swap chart types, edit titles).
- **Scheduled dashboards** — Supabase Edge Function on a cron re-runs the same question, alerts via email or webhook on threshold changes.
- **Multi-tenant orgs** — extend RLS policies to `tenant_id` in addition to `user_id`, with a `memberships` table joining users to tenants.
- **Realtime updates** — Supabase Realtime subscriptions can push live data into already-rendered dashboards.
- **Semantic layer** — graduate from raw SQL to Cube.dev / dbt metrics for production safety as the schema grows.
- **Python agent** — promote to a Turborepo and add a Pydantic AI service if multi-step planning becomes awkward in JS.

---

## 17. Summary

**Lumen** is a single Next.js 14 app backed by Supabase for both auth and Postgres. One API route runs the CopilotKit AG-UI runtime, which exposes a server tool (`run_analytics_query`) that executes user-scoped SQL through a SECURITY INVOKER Postgres function — meaning **Supabase Row Level Security enforces per-user data isolation at the database layer**, regardless of what SQL the LLM writes. A frontend tool (`render_dashboard`) takes an LLM-designed JSON layout tree and renders it through a recursive component tree built from a Zod schema of widgets and containers. The LLM provider (Anthropic or OpenAI) is selected per-request via a thin adapter — never in parallel. The UI is not pre-built: every dashboard is composed at query time by the LLM from primitives the app provides, validated by Zod, and rendered with the app's own design system.

**One question in. A real, data-driven, LLM-designed, RLS-enforced dashboard out.**



## 18. Sources

https://docs.ag-ui.com/introduction

https://github.com/ag-ui-protocol/ag-ui

https://www.copilotkit.ai/ag-ui

https://docs.ag-ui.com/concepts/tools

https://pydantic.dev/docs/ai/integrations/ui/ag-ui/