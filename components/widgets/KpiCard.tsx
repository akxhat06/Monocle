/** Abbreviate numbers >= 1000. Preserves non-numeric suffixes (e.g. "8.0 min" → "8.0 min"). */
function formatValue(raw: string): string {
  // Match a leading number (int or decimal, optionally comma-formatted) and an optional suffix
  const match = raw.match(/^([\d,]+\.?\d*)(\s*.*)$/);
  if (!match) return raw;
  const num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2] ?? "";
  if (isNaN(num)) return raw;
  let abbreviated: string;
  if (num >= 1_000_000) {
    const v = num / 1_000_000;
    abbreviated = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
  } else if (num >= 1_000) {
    const v = num / 1_000;
    abbreviated = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "K";
  } else {
    abbreviated = match[1]; // keep original formatting for < 1000
  }
  return abbreviated + suffix;
}

function valueFontSize(value: string, compact: boolean): string {
  if (compact) return "text-sm";
  const len = value.length;
  if (len <= 5) return "text-2xl";
  if (len <= 8) return "text-xl";
  if (len <= 11) return "text-lg";
  return "text-base";
}

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
    <div className={`rounded-lg border border-white/[0.07] bg-[#1c1c1c] overflow-hidden min-w-0 ${compact ? "p-2.5" : "p-4"}`}>
      <p className={`font-medium uppercase tracking-wider text-[#5a5a5a] ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</p>
      <p className={`font-semibold text-[#f0f0f0] leading-tight ${compact ? "mt-0.5" : "mt-2"} ${valueFontSize(value, compact)}`}>{formatValue(value)}</p>
      {delta ? (
        <p className={`text-violet-400 ${compact ? "text-[9px]" : "mt-1 text-xs"}`}>{delta}</p>
      ) : null}
    </div>
  );
}
