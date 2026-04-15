"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

const COLORS = [
  "#a78bfa", // violet
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fb923c", // orange
  "#f472b6", // pink
  "#fbbf24", // amber
  "#2dd4bf", // teal
  "#f87171", // red
];

function fmtValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  const pct = percent ?? 0;
  if (pct < 0.04) return null; // skip tiny slices
  const RADIAN = Math.PI / 180;
  const ir = Number(innerRadius ?? 0);
  const or = Number(outerRadius ?? 0);
  const ma = Number(midAngle ?? 0);
  const radius = ir + (or - ir) * 0.55;
  const x = Number(cx ?? 0) + radius * Math.cos(-ma * RADIAN);
  const y = Number(cy ?? 0) + radius * Math.sin(-ma * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#f0f0f0"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(pct * 100).toFixed(0)}%`}
    </text>
  );
}

export default function PieChartWidget({
  title,
  data,
  nameKey,
  valueKey,
  donut = false,
  chartHeight = 288,
}: {
  title?: string;
  data: Array<Record<string, unknown>>;
  nameKey: string;
  valueKey: string;
  donut?: boolean;
  chartHeight?: number;
}) {
  const outerRadius = Math.floor(chartHeight * 0.36);
  const innerRadius = donut ? Math.floor(outerRadius * 0.55) : 0;

  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#1c1c1c] p-4">
      {title ? <h3 className="mb-3 text-sm font-medium text-[#c0c0c0]">{title}</h3> : null}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              paddingAngle={donut ? 3 : 1}
              labelLine={false}
              label={CustomLabel}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth={1}
                />
              ))}
            </Pie>

            {/* Donut centre label — total */}
            {donut && (() => {
              const total = data.reduce((s, r) => s + Number(r[valueKey] ?? 0), 0);
              return (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                  <tspan x="50%" dy="-6" fontSize={18} fontWeight={700} fill="#f0f0f0">
                    {fmtValue(total)}
                  </tspan>
                  <tspan x="50%" dy="18" fontSize={10} fill="#5a5a5a">
                    total
                  </tspan>
                </text>
              );
            })()}

            <Tooltip
              contentStyle={{
                background: "#242424",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#f0f0f0",
              }}
              formatter={(v: unknown) => [fmtValue(Number(v ?? 0))]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "#9a9a9a", fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
