/** Local-calendar date helpers for overview API (YYYY-MM-DD). */

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDays(ymd: string, delta: number): string {
  const [y, m, day] = ymd.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + delta);
  return toYmd(d);
}

/** Inclusive number of days in [from, to]. */
export function inclusiveDayCount(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const t0 = new Date(y1, m1 - 1, d1).getTime();
  const t1 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((t1 - t0) / 86400000) + 1;
}

/** Same-length window immediately before `from`..`to`. */
export function previousRange(from: string, to: string): { from: string; to: string } {
  const n = inclusiveDayCount(from, to);
  const prevTo = shiftDays(from, -1);
  const prevFrom = shiftDays(prevTo, -(n - 1));
  return { from: prevFrom, to: prevTo };
}
