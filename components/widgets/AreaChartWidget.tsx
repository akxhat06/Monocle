"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function AreaChartWidget({
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
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey={xKey} stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            {yKeys.map((k) => (
              <Area key={k} type="monotone" dataKey={k} stroke="#c084fc" fill="#c084fc33" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
