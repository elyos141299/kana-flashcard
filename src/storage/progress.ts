/**
 * Penyimpanan progress user di localStorage (fase fondasi).
 * IndexedDB menyusul di Phase 5. API dibuat mirip supaya gampang diganti.
 */
import type { CardProgress } from "../srs/types.js";
import { read, write, PROGRESS_KEY, STATS_KEY, SETTINGS_KEY } from "./kv.js";
import {
  loadCardMeta,
  saveCardMeta,
  validateCardMeta,
} from "./cardMeta.js";
import {
  CURRENT_SCHEMA_VERSION,
  APP_VERSION,
  validateProgress,
  validateStats,
  validateSettings,
  findOrphanedCardIds,
  snapshotStorage,
  restoreStorage,
  setSchemaVersion,
} from "./migrate.js";


export interface DayStats {
  reviewed: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
  /** Counter harian per kategori kartu (Phase 12). */
  newCards: number;
  reviewCards: number;
  learningCards: number;
}

export interface Stats {
  /** "YYYY-MM-DD" -> statistik hari itu */
  days: Record<string, DayStats>;
  streak: number;
  lastActiveDate: string | null;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  defaultCards: number;
  dailyNewLimit: number;
  /** Batas review harian. 0 = tanpa batas. */
  dailyReviewLimit: number;
}

export function loadProgress(): Record<string, CardProgress> {
  return read<Record<string, CardProgress>>(PROGRESS_KEY, {});
}

export function saveProgress(map: Record<string, CardProgress>): void {
  write(PROGRESS_KEY, map);
}

export function emptyDay(): DayStats {
  return { reviewed: 0, again: 0, hard: 0, good: 0, easy: 0, newCards: 0, reviewCards: 0, learningCards: 0 };
}

export function loadStats(): Stats {
  return read<Stats>(STATS_KEY, { days: {}, streak: 0, lastActiveDate: null });
}

export function saveStats(s: Stats): void {
  write(STATS_KEY, s);
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Catat satu review ke statistik harian + streak. */
export function recordReview(rating: "again" | "hard" | "good" | "easy"): Stats {
  const stats = loadStats();
  const key = todayKey();
  const day = stats.days[key] ?? emptyDay();
  day.reviewed += 1;
  day[rating] += 1;
  stats.days[key] = day;

  if (stats.lastActiveDate !== key) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = todayKey(yesterday);
    stats.streak = stats.lastActiveDate === yKey ? stats.streak + 1 : 1;
    stats.lastActiveDate = key;
  }
  saveStats(stats);
  return stats;
}

/**
 * Catat satu kartu yang benar-benar dinilai, berdasarkan kategorinya
 * saat dinilai (new / learning / review). Dipanggil bersamaan dengan
 * recordReview di handleRate — bukan saat kartu masuk queue.
 */
export function recordCardRated(source: "new" | "learning" | "review"): Stats {
  const stats = loadStats();
  const key = todayKey();
  const day = stats.days[key] ?? emptyDay();
  if (source === "new") day.newCards = (day.newCards ?? 0) + 1;
  else if (source === "review") day.reviewCards = (day.reviewCards ?? 0) + 1;
  else day.learningCards = (day.learningCards ?? 0) + 1;
  stats.days[key] = day;
  saveStats(stats);
  return stats;
}

/** Counter harian untuk tanggal lokal tertentu (default: hari ini). */
export function getDailyCounts(dateKey: string = todayKey()): {
  newCards: number;
  reviewCards: number;
  learningCards: number;
} {
  const day = loadStats().days[dateKey];
  return {
    newCards: day?.newCards ?? 0,
    reviewCards: day?.reviewCards ?? 0,
    learningCards: day?.learningCards ?? 0,
  };
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  defaultCards: 20,
  dailyNewLimit: 20,
  dailyReviewLimit: 100,
};

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, s);
}

export function exportAll(): string {
  return JSON.stringify(
    {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      progress: loadProgress(),
      stats: loadStats(),
      settings: loadSettings(),
      cardMetadata: loadCardMeta(),
    },
    null,
    2,
  );
}

export interface ImportResult {
  /** Apakah import berhasil diterapkan. */
  ok: boolean;
  /** Apakah data dimigrasi dari schema lama. */
  migrated: boolean;
  /** Jumlah record orphan yang dipertahankan (dilaporkan, tidak dihapus). */
  orphanedProgress: number;
  orphanedMeta: number;
}

/**
 * Import atomic dengan versioning (Phase 19):
 * 1. Parse JSON — gagal → throw, data current utuh.
 * 2. Cek schemaVersion — tidak dikenal (masa depan) → throw.
 *    Hilang → dianggap v1 (export lama sebelum versioning).
 * 3. Validasi SELURUH section dulu — ada yang invalid → throw.
 * 4. Backup current → tulis semua → jika gagal di tengah → restore.
 * 5. Orphan dipertahankan, hanya dilaporkan jumlahnya.
 */
export function importAll(json: string): ImportResult {
  let data: {
    schemaVersion?: unknown;
    progress?: unknown;
    stats?: unknown;
    settings?: unknown;
    cardMetadata?: unknown;
  };
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("File bukan JSON yang valid.");
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Format file tidak dikenal.");
  }

  const schemaVersion =
    data.schemaVersion === undefined ? 1 : data.schemaVersion;
  if (
    typeof schemaVersion !== "number" ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion < 1 ||
    schemaVersion > CURRENT_SCHEMA_VERSION
  ) {
    throw new Error(
      `Backup ini memakai schema v${String(data.schemaVersion)} yang tidak didukung. Data saat ini tidak diubah.`,
    );
  }

  // Validasi semua dulu — atomic, tanpa partial write.
  const progress = validateProgress(data.progress ?? {});
  if (!progress) throw new Error("Bagian progress pada file tidak valid.");
  const stats = validateStats(
    data.stats ?? { days: {}, streak: 0, lastActiveDate: null },
  );
  if (!stats) throw new Error("Bagian stats pada file tidak valid.");
  const settings = validateSettings(data.settings);
  if (!settings) throw new Error("Bagian settings pada file tidak valid.");
  const cardMetadata = validateCardMeta(data.cardMetadata ?? {});
  if (!cardMetadata) throw new Error("Bagian cardMetadata pada file tidak valid.");

  // Migrasi data import jika dari schema lama (berurutan, dengan backup).
  const migrated = schemaVersion < CURRENT_SCHEMA_VERSION;

  const backup = snapshotStorage();
  try {
    saveProgress(progress);
    saveStats(stats);
    saveSettings(settings);
    saveCardMeta(cardMetadata);
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
  } catch (e) {
    restoreStorage(backup);
    throw e;
  }

  const orphans = findOrphanedCardIds(progress, cardMetadata);
  return {
    ok: true,
    migrated,
    orphanedProgress: orphans.progress.length,
    orphanedMeta: orphans.meta.length,
  };
}

export function resetAll(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(STATS_KEY);
}
