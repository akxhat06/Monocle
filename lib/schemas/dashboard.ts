import { z } from "zod";

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

const KpiWidgetSchema = z.object({
  type: z.literal("kpi"),
  label: z.string(),
  value: z.string(),
  delta: z.string().optional()
});

const MarkdownWidgetSchema = z.object({
  type: z.literal("markdown"),
  content: z.string()
});

const TableWidgetSchema = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.unknown()))
});

const BarWidgetSchema = z.object({
  type: z.literal("bar"),
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())),
  xKey: z.string(),
  yKeys: z.array(z.string())
});

const LineWidgetSchema = z.object({
  type: z.literal("line"),
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())),
  xKey: z.string(),
  yKeys: z.array(z.string())
});

const AreaWidgetSchema = z.object({
  type: z.literal("area"),
  title: z.string().optional(),
  data: z.array(z.record(z.string(), z.unknown())),
  xKey: z.string(),
  yKeys: z.array(z.string())
});

const WidgetSchema = z.discriminatedUnion("type", [KpiWidgetSchema, MarkdownWidgetSchema, TableWidgetSchema, BarWidgetSchema, LineWidgetSchema, AreaWidgetSchema]);

const LayoutNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    WidgetSchema,
    z.object({
      type: z.literal("row"),
      children: z.array(LayoutNodeSchema)
    }),
    z.object({
      type: z.literal("col"),
      children: z.array(LayoutNodeSchema)
    }),
    z.object({
      type: z.literal("grid"),
      columns: z.number().int().min(1).max(12),
      children: z.array(LayoutNodeSchema)
    })
  ])
);

export const DashboardSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  layout: LayoutNodeSchema
});
