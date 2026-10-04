/**
 * Penyimpanan progress user di localStorage (fase fondasi).
 * IndexedDB menyusul di Phase 5. API dibuat mirip supaya gampang diganti.
 */
import type { CardProgress } from "../srs/types.js";
import {
  loadCardMeta,
  saveCardMeta,
  validateCardMeta,
} from "./cardMeta.js";

const PROGRESS_KEY = "kana.progress.v1";
const STATS_KEY = "kana.stats.v1";
const SETTINGS_KEY = "kana.settings.v1";

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

const DEFAULT_SETTINGS: Settings = {
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
      progress: loadProgress(),
      stats: loadStats(),
      settings: loadSettings(),
      cardMetadata: loadCardMeta(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function importAll(json: string): void {
  const data = JSON.parse(json) as {
    progress?: Record<string, CardProgress>;
    stats?: Stats;
    settings?: Settings;
    cardMetadata?: unknown;
  };
  if (data.progress) saveProgress(data.progress);
  if (data.stats) saveStats(data.stats);
  if (data.settings) saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  // Metadata malformed ditolak diam-diam — data lama tetap utuh.
  const meta = validateCardMeta(data.cardMetadata);
  if (meta) saveCardMeta(meta);
}

export function resetAll(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(STATS_KEY);
}
