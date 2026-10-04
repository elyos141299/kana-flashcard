/**
 * Data versioning & migration (Phase 19).
 *
 * Prinsip: data pengguna lebih penting daripada source code.
 * - Schema version tunggal untuk seluruh user data (progress, stats,
 *   settings, card metadata).
 * - Migration berjalan berurutan (v1 → v2 → v3 …), dengan backup snapshot
 *   sebelum mulai; jika gagal → restore backup → throw.
 * - Berjalan hanya saat app startup (version berbeda) atau saat import.
 * - v1 adalah baseline — belum ada migration step (MIGRATIONS kosong).
 */
import type { CardProgress } from "../srs/types.js";
import { getCardById } from "../data/cards.js";
import { DEFAULT_SETTINGS, type Stats, type Settings } from "./progress.js";
import {
  read,
  write,
  PROGRESS_KEY,
  STATS_KEY,
  SETTINGS_KEY,
  META_KEY,
  VERSION_KEY,
} from "./kv.js";

export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = "0.1.0";

/** Semua key yang dikelola sistem versioning (untuk snapshot/backup). */
export const MANAGED_KEYS = [
  PROGRESS_KEY,
  STATS_KEY,
  SETTINGS_KEY,
  META_KEY,
  VERSION_KEY,
] as const;

export interface MigrationStep {
  from: number;
  to: number;
  /** Boleh throw → memicu rollback. */
  up: () => void;
}

/**
 * Migration terdaftar, berurutan. Kosong untuk v1 (baseline).
 * Contoh step masa depan: { from: 1, to: 2, up: () => { ... } }.
 */
export const MIGRATIONS: MigrationStep[] = [];

export function getSchemaVersion(): number {
  const v = read<unknown>(VERSION_KEY, 0);
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0;
}

export function setSchemaVersion(v: number): void {
  write(VERSION_KEY, v);
}

/** Snapshot mentah semua managed keys (string | null per key). */
export function snapshotStorage(): Record<string, string | null> {
  const snap: Record<string, string | null> = {};
  for (const k of MANAGED_KEYS) {
    try {
      snap[k] = localStorage.getItem(k);
    } catch {
      snap[k] = null;
    }
  }
  return snap;
}

/** Kembalikan storage ke snapshot. Dipakai saat migration/import gagal. */
export function restoreStorage(snap: Record<string, string | null>): void {
  for (const k of MANAGED_KEYS) {
    const v = snap[k];
    try {
      if (v === undefined || v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      // abaikan — best effort restore
    }
  }
}

/**
 * Jalankan migrasi dari `from` ke `target` memakai `steps`.
 * Backup dulu; jika step gagal atau tidak ditemukan → restore → throw.
 */
export function runMigrations(
  steps: MigrationStep[],
  from: number,
  target: number = CURRENT_SCHEMA_VERSION,
): void {
  if (from >= target) return;
  const backup = snapshotStorage();
  try {
    let v = from;
    while (v < target) {
      const step = steps.find((s) => s.from === v);
      if (!step) throw new Error(`No migration registered from schema v${v}`);
      step.up();
      v = step.to;
      setSchemaVersion(v);
    }
  } catch (e) {
    restoreStorage(backup);
    throw e;
  }
}

/**
 * Dipanggil sekali saat app startup.
 * - v0 (pre-versioning): adopsi data existing sebagai v1, tanpa perubahan.
 * - v < CURRENT: migrasi berurutan dengan backup/rollback.
 * - v > CURRENT (masa depan): jangan sentuh apa pun.
 */
export function ensureMigrated(): void {
  const v = getSchemaVersion();
  if (v === 0) {
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
    return;
  }
  if (v < CURRENT_SCHEMA_VERSION) {
    runMigrations(MIGRATIONS, v, CURRENT_SCHEMA_VERSION);
  }
}

// ---------------------------------------------------------------------------
// Validators (untuk import — atomic: validasi semua dulu sebelum menulis)
// ---------------------------------------------------------------------------

const CARD_STATES = new Set(["new", "learning", "review"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validasi progress; record invalid → null (seluruh import ditolak). */
export function validateProgress(
  data: unknown,
): Record<string, CardProgress> | null {
  if (!isRecord(data)) return null;
  const out: Record<string, CardProgress> = {};
  for (const [id, v] of Object.entries(data)) {
    if (!isRecord(v)) return null;
    if (typeof v.cardId !== "string" || v.cardId !== id) return null;
    if (typeof v.state !== "string" || !CARD_STATES.has(v.state)) return null;
    if (typeof v.interval !== "number" || typeof v.dueAt !== "string") return null;
    if (typeof v.reviewCount !== "number" || typeof v.lapses !== "number") return null;
    out[id] = v as unknown as CardProgress;
  }
  return out;
}

/** Validasi stats; invalid → null. */
export function validateStats(data: unknown): Stats | null {
  if (!isRecord(data)) return null;
  if (!isRecord(data.days)) return null;
  if (typeof data.streak !== "number") return null;
  if (
    data.lastActiveDate !== null &&
    data.lastActiveDate !== undefined &&
    typeof data.lastActiveDate !== "string"
  ) {
    return null;
  }
  return data as unknown as Stats;
}

/**
 * Validasi settings; lenient — field hilang diisi default aman,
 * field tak dikenal diabaikan.
 */
export function validateSettings(data: unknown): Settings | null {
  if (data === undefined) return { ...DEFAULT_SETTINGS };
  if (!isRecord(data)) return null;
  return { ...DEFAULT_SETTINGS, ...data };
}

// ---------------------------------------------------------------------------
// Orphan detection
// ---------------------------------------------------------------------------

export interface OrphanReport {
  progress: string[];
  meta: string[];
}

/**
 * Deteksi cardId yang tidak ada di dataset (mis. card dihapus di masa depan).
 * Data orphan DIPERTAHANKAN — hanya dilaporkan jumlahnya.
 */
export function findOrphanedCardIds(
  progress: Record<string, CardProgress>,
  meta: Record<string, { favorite: boolean; suspended: boolean }>,
): OrphanReport {
  const orphans: OrphanReport = { progress: [], meta: [] };
  for (const id of Object.keys(progress)) {
    if (!getCardById(id)) orphans.progress.push(id);
  }
  for (const id of Object.keys(meta)) {
    if (!getCardById(id)) orphans.meta.push(id);
  }
  return orphans;
}
