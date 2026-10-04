/**
 * Regression test §10: satu rating = SATU review tercatat, SATU progress entry.
 * Memakai modul storage asli dengan stub localStorage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { rateCard } from "../srs/scheduler.js";
import {
  loadProgress,
  saveProgress,
  recordReview,
  loadStats,
} from "../storage/progress.js";

// stub localStorage minimal
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

beforeEach(() => store.clear());

/** Replika urutan operasi handleRate di Study.tsx untuk satu rating. */
function applyRating(cardId: string, rating: "again" | "hard" | "good" | "easy") {
  const progress = loadProgress();
  progress[cardId] = rateCard(progress[cardId] ?? null, cardId, rating);
  saveProgress(progress);
  recordReview(rating);
}

describe("double counting audit (§10)", () => {
  it("satu rating → tepat 1 review tercatat", () => {
    applyRating("kanji-n5-001", "good");
    const stats = loadStats();
    const today = Object.values(stats.days)[0];
    expect(today.reviewed).toBe(1);
    expect(today.good).toBe(1);
  });

  it("satu rating → tepat 1 progress entry untuk kartu itu", () => {
    applyRating("kanji-n5-001", "good");
    const progress = loadProgress();
    expect(Object.keys(progress)).toHaveLength(1);
    expect(progress["kanji-n5-001"].cardId).toBe("kanji-n5-001");
  });

  it("dua kartu berbeda → 2 review, 2 entry (tidak tercampur)", () => {
    applyRating("kanji-n5-001", "good");
    applyRating("kanji-n5-002", "easy");
    const stats = loadStats();
    expect(Object.values(stats.days)[0].reviewed).toBe(2);
    expect(Object.keys(loadProgress())).toHaveLength(2);
  });

  it("rating ulang kartu yang sama menimpa entry (bukan duplikat)", () => {
    applyRating("kanji-n5-001", "good");
    applyRating("kanji-n5-001", "easy");
    const progress = loadProgress();
    expect(Object.keys(progress)).toHaveLength(1);
    expect(progress["kanji-n5-001"].state).toBe("review");
    // dua aksi rating = dua review tercatat (wajar), tapi satu entry kartu
    expect(Object.values(loadStats().days)[0].reviewed).toBe(2);
  });
});
