"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      {title ? <h3 className="mb-3 text-sm font-medium">{title}</h3> : null}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey={xKey} stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            {yKeys.map((k) => (
              <Bar key={k} dataKey={k} fill="#60a5fa" radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
