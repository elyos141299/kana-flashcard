/**
 * Transisi kartu NEW dan LEARNING.
 * Aturan sesuai SRS RULES §3 (kartu baru) dan §4 (learning steps).
 */
import {
  LEARNING_STEPS_MIN,
  GRADUATING_INTERVAL_DAYS,
  EASY_GRADUATING_INTERVAL_DAYS,
  MIN_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  DEFAULT_EASE,
} from "./types.js";
import type { CardProgress, Rating } from "./types.js";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function clampInterval(days: number): number {
  return Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(days)));
}

export function newProgress(cardId: string, now: Date): CardProgress {
  const iso = now.toISOString();
  return {
    cardId,
    state: "new",
    interval: 0,
    ease: DEFAULT_EASE,
    dueAt: iso,
    learningStep: 0,
    reviewCount: 0,
    lapses: 0,
    lastReviewedAt: null,
    createdAt: iso,
    previousInterval: null,
  };
}

/** Kartu NEW pertama kali dinilai. */
export function rateNewCard(cardId: string, rating: Rating, now: Date): CardProgress {
  const p = newProgress(cardId, now);
  const lastReviewedAt = now.toISOString();

  switch (rating) {
    case "again":
      // NEW + Again -> LEARNING, 1 menit
      return { ...p, state: "learning", learningStep: 0, dueAt: addMinutes(now, 1).toISOString(), reviewCount: 1, lastReviewedAt };
    case "hard":
      // NEW + Hard -> LEARNING, 5 menit
      return { ...p, state: "learning", learningStep: 1, dueAt: addMinutes(now, 5).toISOString(), reviewCount: 1, lastReviewedAt };
    case "good":
      // NEW + Good -> LEARNING, 10 menit
      return { ...p, state: "learning", learningStep: 2, dueAt: addMinutes(now, 10).toISOString(), reviewCount: 1, lastReviewedAt };
    case "easy":
      // NEW + Easy -> langsung REVIEW, interval 4 hari
      return {
        ...p,
        state: "review",
        interval: EASY_GRADUATING_INTERVAL_DAYS,
        dueAt: addDays(now, EASY_GRADUATING_INTERVAL_DAYS).toISOString(),
        reviewCount: 1,
        lastReviewedAt,
      };
  }
}

/** Graduate dari learning ke review. Jika kartu ini lapse, pakai aturan 0.3x. */
function graduate(p: CardProgress, baseIntervalDays: number, now: Date): CardProgress {
  const interval =
    p.previousInterval != null
      ? clampInterval(p.previousInterval * 0.3)
      : clampInterval(baseIntervalDays);
  return {
    ...p,
    state: "review",
    interval,
    dueAt: addDays(now, interval).toISOString(),
    learningStep: 0,
    previousInterval: null,
    reviewCount: p.reviewCount + 1,
    lastReviewedAt: now.toISOString(),
  };
}

/** Kartu LEARNING dinilai. */
export function rateLearningCard(p: CardProgress, rating: Rating, now: Date): CardProgress {
  const lastReviewedAt = now.toISOString();
  const lastStep = LEARNING_STEPS_MIN.length - 1;

  switch (rating) {
    case "again":
      // Kembali ke step awal (1 menit)
      return {
        ...p,
        learningStep: 0,
        dueAt: addMinutes(now, LEARNING_STEPS_MIN[0]).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    case "hard":
      // Tetap di learning, dijadwalkan +5 menit dari sekarang
      return {
        ...p,
        dueAt: addMinutes(now, 5).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    case "good": {
      // Naik satu step; Good di step terakhir = graduate (interval 1 hari)
      if (p.learningStep >= lastStep) return graduate(p, GRADUATING_INTERVAL_DAYS, now);
      const next = p.learningStep + 1;
      return {
        ...p,
        learningStep: next,
        dueAt: addMinutes(now, LEARNING_STEPS_MIN[next]).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    }
    case "easy":
      // Langsung graduate (interval 4 hari, atau aturan lapse jika habis lapse)
      return graduate(p, EASY_GRADUATING_INTERVAL_DAYS, now);
  }
}
