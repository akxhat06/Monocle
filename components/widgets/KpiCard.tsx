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
    <div className={`rounded-lg border border-white/[0.07] bg-[#1c1c1c] ${compact ? "p-2.5" : "p-4"}`}>
      <p className={`font-medium uppercase tracking-wider text-[#5a5a5a] ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</p>
      <p className={`font-semibold text-[#f0f0f0] ${compact ? "mt-0.5 text-sm" : "mt-2 text-2xl"}`}>{value}</p>
      {delta ? (
        <p className={`text-violet-400 ${compact ? "text-[9px]" : "mt-1 text-xs"}`}>{delta}</p>
      ) : null}
    </div>
  );
}
