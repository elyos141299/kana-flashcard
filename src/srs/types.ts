/**
 * SRS types — spaced repetition engine.
 * UI dilarang menghitung interval langsung; selalu lewat rateCard().
 */

export type CardState = "new" | "learning" | "review";
export type Rating = "again" | "hard" | "good" | "easy";

export interface CardProgress {
  cardId: string;
  state: CardState;
  /** Interval review dalam hari (integer). 0 untuk new/learning. */
  interval: number;
  /** Disimpan untuk pengembangan masa depan; belum dipakai algoritma MVP. */
  ease: number;
  /** Waktu jatuh tempo, UTC ISO string. */
  dueAt: string;
  /** Index ke LEARNING_STEPS_MIN. */
  learningStep: number;
  reviewCount: number;
  lapses: number;
  lastReviewedAt: string | null;
  createdAt: string;
  /**
   * Interval sebelum lapse. Diisi saat Again dari REVIEW,
   * dipakai saat graduate dari relearning: interval baru = max(round(prev*0.3),1).
   */
  previousInterval: number | null;
}

// ---- Konstanta sesuai SRS RULES ----

/** Learning steps dalam menit: [1m, 5m, 10m]. Lulus (Good di step terakhir) -> review 1 hari. */
export const LEARNING_STEPS_MIN: readonly number[] = [1, 5, 10];

/** Interval pertama saat graduate lewat Good. */
export const GRADUATING_INTERVAL_DAYS = 1;

/** Interval pertama saat graduate lewat Easy (langsung dari NEW maupun LEARNING). */
export const EASY_GRADUATING_INTERVAL_DAYS = 4;

export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 365;

/** Kartu dianggap mature jika state=review dan interval >= 21 hari. */
export const MATURE_INTERVAL_DAYS = 21;

export const DEFAULT_EASE = 2.5;

/** Kartu mature = review mapan (bukan state terpisah di MVP). */
export function isMature(p: CardProgress): boolean {
  return p.state === "review" && p.interval >= MATURE_INTERVAL_DAYS;
}

/** Kartu dianggap due jika dueAt <= waktu sekarang. */
export function isDue(p: CardProgress, now: Date = new Date()): boolean {
  return new Date(p.dueAt).getTime() <= now.getTime();
}
