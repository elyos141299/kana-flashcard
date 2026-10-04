/**
 * Tipe untuk Smart Study Queue (Phase 12).
 * Queue hanya mengatur URUTAN dan PEMILIHAN kartu — SRS engine tidak diubah.
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";

/** Kategori kartu berdasarkan progress SRS. Hanya tiga — tidak ada state keempat. */
export type CardSource = "new" | "learning" | "review";

export interface QueueCard {
  card: KanaCard | KanjiCard;
  source: CardSource;
  /** Prompt recall (Phase 11). Undefined untuk recognition. */
  prompt?: string;
}

export interface QueueLimits {
  /** Kartu NEW maksimal per hari. */
  dailyNew: number;
  /** Kartu REVIEW maksimal per hari. 0 = tanpa batas. */
  dailyReview: number;
}

export interface DailyCounts {
  newCards: number;
  reviewCards: number;
  learningCards: number;
}

export interface QueueCounts {
  learningDue: number;
  reviewDue: number;
  /** NEW yang tersedia dalam dataset (di luar limit). */
  newAvailable: number;
  /** NEW yang masih boleh masuk sesi hari ini (setelah limit). */
  newRemaining: number;
}

export interface QueueResult {
  cards: QueueCard[];
  counts: QueueCounts;
  /**
   * Waktu due terdekat berikutnya (ISO string) untuk empty state.
   * null jika tidak ada kartu yang terjadwal.
   */
  nextReviewAt: string | null;
}

export const SOURCE_LABELS: Record<CardSource, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
};
