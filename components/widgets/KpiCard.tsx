export default function KpiCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {delta ? <p className="mt-1 text-xs text-emerald-400">{delta}</p> : null}
    </div>
  );
}
