import type { LayoutNode } from "@/lib/schemas/dashboard";
import AreaChartWidget from "./widgets/AreaChartWidget";
import BarChartWidget from "./widgets/BarChartWidget";
import DataTableWidget from "./widgets/DataTableWidget";
import KpiCard from "./widgets/KpiCard";
import LineChartWidget from "./widgets/LineChartWidget";
import MarkdownWidget from "./widgets/MarkdownWidget";

export default function DashboardRenderer({ node }: { node: LayoutNode }) {
  switch (node.type) {
    case "row":
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {node.children.map((child: LayoutNode, i: number) => (
            <DashboardRenderer key={i} node={child} />
          ))}
        </div>
      );
    case "col":
      return (
        <div className="flex flex-col gap-4">
          {node.children.map((child: LayoutNode, i: number) => (
            <DashboardRenderer key={i} node={child} />
          ))}
        </div>
      );
    case "grid":
      return (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${node.columns}, minmax(0, 1fr))` }}>
          {node.children.map((child: LayoutNode, i: number) => (
            <DashboardRenderer key={i} node={child} />
          ))}
        </div>
      );
    case "kpi":
      return <KpiCard label={node.label} value={node.value} delta={node.delta} />;
    case "markdown":
      return <MarkdownWidget content={node.content} />;
    case "table":
      return <DataTableWidget title={node.title} columns={node.columns} rows={node.rows} />;
    case "bar":
      return <BarChartWidget title={node.title} data={node.data} xKey={node.xKey} yKeys={node.yKeys} />;
    case "line":
      return <LineChartWidget title={node.title} data={node.data} xKey={node.xKey} yKeys={node.yKeys} />;
    case "area":
      return <AreaChartWidget title={node.title} data={node.data} xKey={node.xKey} yKeys={node.yKeys} />;
    default:
      return null;
  }
}
