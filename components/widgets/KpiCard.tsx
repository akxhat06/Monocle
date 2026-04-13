export default function KpiCard({
  label,
  value,
  delta,
  compact = false,
}: {
  label: string;
  value: string;
  delta?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900 ${compact ? "p-2.5" : "p-4"}`}>
      <p className={`uppercase tracking-wide text-zinc-400 ${compact ? "text-[9px]" : "text-xs"}`}>{label}</p>
      <p className={`font-semibold text-zinc-100 ${compact ? "mt-0.5 text-base" : "mt-2 text-2xl"}`}>{value}</p>
      {delta ? (
        <p className={`text-emerald-400 ${compact ? "text-[9px]" : "mt-1 text-xs"}`}>{delta}</p>
      ) : null}
    </div>
  );
}
