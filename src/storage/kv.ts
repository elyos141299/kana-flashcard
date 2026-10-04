/**
 * Storage keys + low-level read/write (Phase 19).
 * Modul tanpa dependency — menjadi fondasi agar tidak ada circular import
 * antara progress.ts, cardMeta.ts, dan migrate.ts.
 */
export const PROGRESS_KEY = "kana.progress.v1";
export const STATS_KEY = "kana.stats.v1";
export const SETTINGS_KEY = "kana.settings.v1";
export const META_KEY = "kana.cardmeta.v1";
export const VERSION_KEY = "kana.schema.version";

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage penuh / mode privat: abaikan, app tetap jalan
  }
}
