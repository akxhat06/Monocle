import { z } from "zod";

// ── TypeScript types ──────────────────────────────────────────────────────────

export type KpiWidget = {
  type: "kpi";
  label: string;
  value: string;
  delta?: string;
};

export type MarkdownWidget = {
  type: "markdown";
  content: string;
};

export type TableWidget = {
  type: "table";
  title?: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  pageSize?: number;
};

export type BarWidget = {
  type: "bar";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
};

export type LineWidget = {
  type: "line";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
};

export type AreaWidget = {
  type: "area";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
};

export type Widget = KpiWidget | MarkdownWidget | TableWidget | BarWidget | LineWidget | AreaWidget;
export type LayoutNode =
  | Widget
  | { type: "row"; children: LayoutNode[] }
  | { type: "col"; children: LayoutNode[] }
  | { type: "grid"; columns: number; children: LayoutNode[] };

export type Dashboard = {
  title?: string;
  description?: string;
  layout: LayoutNode;
};

// ── Zod schemas — lenient input, normalized output ───────────────────────────
// The AI sometimes deviates from the spec. These schemas are tolerant of
// common variants and transform them into the canonical shape before rendering.

// KPI: accept title OR label, value as string OR number, suffix appended
const KpiWidgetSchema = z
  .object({
    type: z.literal("kpi"),
    label: z.string().optional(),
    title: z.string().optional(),               // AI sometimes uses "title"
    value: z.union([z.string(), z.number()]),
    suffix: z.string().optional(),              // AI sometimes appends a unit
    delta: z.string().optional(),
  })
  .transform((d): KpiWidget => ({
    type: "kpi",
    label: d.label ?? d.title ?? "Metric",
    value: d.suffix
      ? `${d.value} ${d.suffix}`
      : String(d.value),
    delta: d.delta,
  }));

const MarkdownWidgetSchema = z.object({
  type: z.literal("markdown"),
  content: z.string(),
});

const TableWidgetSchema = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown())),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// Shared chart fields
const chartFields = {
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())),
  xKey: z.string(),
  yKeys: z.array(z.string()),
};

const BarWidgetSchema = z.object({ type: z.literal("bar"), ...chartFields });
const LineWidgetSchema = z.object({ type: z.literal("line"), ...chartFields });
const AreaWidgetSchema = z.object({ type: z.literal("area"), ...chartFields });

// "chart" with a "chartType" field — the AI sometimes emits this instead of
// using the type directly ("type": "chart", "chartType": "line")
const ChartAliasSchema = z
  .object({
    type: z.literal("chart"),
    chartType: z.enum(["line", "bar", "area"]),
    title: z.string().optional(),
    data: z.array(z.record(z.string(), z.unknown())),
    xKey: z.string(),
    yKeys: z.array(z.string()),
  })
  .transform((d) => ({
    type: d.chartType,
    title: d.title,
    data: d.data,
    xKey: d.xKey,
    yKeys: d.yKeys,
  }));

// The full widget union, including the "chart" alias
const WidgetSchema = z.union([
  KpiWidgetSchema,
  MarkdownWidgetSchema,
  TableWidgetSchema,
  BarWidgetSchema,
  LineWidgetSchema,
  AreaWidgetSchema,
  ChartAliasSchema,
]);

// Recursive layout nodes
const LayoutNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    WidgetSchema,
    z.object({
      type: z.literal("row"),
      children: z.array(LayoutNodeSchema),
    }),
    z.object({
      type: z.literal("col"),
      children: z.array(LayoutNodeSchema),
    }),
    z.object({
      type: z.literal("grid"),
      columns: z.number().int().min(1).max(12),
      children: z.array(LayoutNodeSchema),
    }),
  ])
);

export const DashboardSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  layout: LayoutNodeSchema,
});
