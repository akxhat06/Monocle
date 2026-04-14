"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fb923c", "#f472b6"];

function fmtTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export default function BarChartWidget({
  title,
  data,
  xKey,
  yKeys,
  chartHeight = 288,
}: {
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
  chartHeight?: number;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#1c1c1c] p-4">
      {title ? <h3 className="mb-3 text-sm font-medium text-[#c0c0c0]">{title}</h3> : null}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="transparent"
              tick={{ fill: "#5a5a5a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "#5a5a5a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtTick}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#242424",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#f0f0f0",
              }}
              formatter={(v) => [fmtTick(Number(v ?? 0))]}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            {yKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
