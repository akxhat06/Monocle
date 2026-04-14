"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fb923c", "#f472b6"];
const FILLS  = ["#a78bfa22", "#60a5fa22", "#34d39922", "#fb923c22", "#f472b622"];

function fmtTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

export default function AreaChartWidget({
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
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              {yKeys.map((k, i) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS[i % COLORS.length]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
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
              cursor={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            {yKeys.map((k, i) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stroke={COLORS[i % COLORS.length]}
                fill={`url(#grad-${k})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
