"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function LineChartWidget({
  title,
  data,
  xKey,
  yKeys
}: {
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKeys: string[];
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      {title ? <h3 className="mb-3 text-sm font-medium">{title}</h3> : null}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey={xKey} stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            {yKeys.map((k) => (
              <Line key={k} type="monotone" dataKey={k} stroke="#34d399" strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
