/**
 * Study History — logika tanggal murni (Phase 24).
 * Tidak menyentuh storage; menerima `days` apa adanya dari loadStats().
 * Semua key tanggal memakai format lokal "YYYY-MM-DD" (lihat todayKey).
 */

export type HistoryRange = 7 | 30 | "all";

export const HISTORY_RANGES: HistoryRange[] = [7, 30, "all"];

export function rangeLabel(r: HistoryRange): string {
  if (r === 7) return "7 Hari";
  if (r === 30) return "30 Hari";
  return "Semua";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" lokal untuk Date tertentu. */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse "YYYY-MM-DD" -> Date lokal (null jika invalid). */
export function fromKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  // Tolak overflow (mis. 2026-13-99 dinormalisasi JS menjadi tanggal valid).
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Daftar key tanggal untuk range, diurut menaik, selalu berakhir hari ini.
 * - 7 / 30: N hari terakhir termasuk hari ini.
 * - "all": dari tanggal tercatat paling awal sampai hari ini.
 *   Key invalid diabaikan; jika tidak ada data valid -> [].
 */
export function buildDateKeys(
  range: HistoryRange,
  days: Record<string, unknown>,
  today: Date = new Date(),
): string[] {
  const todayK = toKey(today);
  if (range === 7 || range === 30) {
    const out: string[] = [];
    for (let i = range - 1; i >= 0; i--) out.push(toKey(addDays(today, -i)));
    return out;
  }
  const valid = Object.keys(days)
    .map((k) => ({ k, d: fromKey(k) }))
    .filter((x): x is { k: string; d: Date } => x.d !== null)
    .sort((a, b) => (a.k < b.k ? -1 : 1));
  if (valid.length === 0) return [];
  const start = valid[0].d;
  const out: string[] = [];
  for (let d = start; toKey(d) <= todayK; d = addDays(d, 1)) out.push(toKey(d));
  return out;
}

/** Label pendek Indonesia untuk header heatmap (Senin dulu). */
export const WEEKDAY_SHORT = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"] as const;
export const WEEKDAY_LONG = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

/** Index kolom 0=Senin untuk Date tertentu. */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** "1 Okt 2026" untuk key tanggal. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
] as const;

export function prettyDate(key: string): string {
  const d = fromKey(key);
  if (!d) return key;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Nama hari Indonesia untuk key tanggal. */
export function weekdayName(key: string): string {
  const d = fromKey(key);
  if (!d) return "";
  return WEEKDAY_LONG[mondayIndex(d)];
}
