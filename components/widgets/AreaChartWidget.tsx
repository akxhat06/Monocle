"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6"];
const FILLS  = ["#34d39933", "#60a5fa33", "#a78bfa33", "#fb923c33", "#f472b633"];

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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      {title ? <h3 className="mb-3 text-sm font-medium text-zinc-200">{title}</h3> : null}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <defs>
              {yKeys.map((k, i) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey={xKey}
              stroke="#71717a"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtTick}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
                color: "#f4f4f5",
              }}
              formatter={(v) => [fmtTick(Number(v ?? 0))]}
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
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
