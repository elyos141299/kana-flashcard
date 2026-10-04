/**
 * Transisi kartu REVIEW.
 * Aturan sesuai SRS RULES §6 (review), §7 (interval limit), §8 (rounding).
 */
import {
  LEARNING_STEPS_MIN,
  MIN_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
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

/** Kartu REVIEW dinilai. */
export function rateReviewCard(p: CardProgress, rating: Rating, now: Date): CardProgress {
  const lastReviewedAt = now.toISOString();

  switch (rating) {
    case "again": {
      // Lapse: kembali ke LEARNING (+10 menit). Interval lama disimpan,
      // dipakai lagi saat graduate dari relearning.
      return {
        ...p,
        state: "learning",
        learningStep: LEARNING_STEPS_MIN.length - 1,
        dueAt: addMinutes(now, 10).toISOString(),
        lapses: p.lapses + 1,
        previousInterval: p.interval,
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    }
    case "hard": {
      // max(interval x 1.2, interval + 1 hari)
      const interval = clampInterval(Math.max(p.interval * 1.2, p.interval + 1));
      return {
        ...p,
        interval,
        dueAt: addDays(now, interval).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    }
    case "good": {
      // interval x 2.5
      const interval = clampInterval(p.interval * 2.5);
      return {
        ...p,
        interval,
        dueAt: addDays(now, interval).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    }
    case "easy": {
      // interval x 4
      const interval = clampInterval(p.interval * 4);
      return {
        ...p,
        interval,
        dueAt: addDays(now, interval).toISOString(),
        reviewCount: p.reviewCount + 1,
        lastReviewedAt,
      };
    }
  }
}
