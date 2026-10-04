/**
 * PART A — Export/Import E2E dengan Vocabulary.
 *
 * Alur: review vocab → favorite → suspend → export → reset → import
 * → verifikasi semua state kembali.
 *
 * Juga: old export tanpa vocab → import PASS.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  exportAll,
  importAll,
  loadProgress,
  saveProgress,
  loadStats,
  recordReview,
  resetAll,
} from "../progress.js";
import {
  toggleFavorite,
  setSuspended,
  loadCardMeta,
} from "../cardMeta.js";
import { VOCAB_N5 } from "../../data/vocab/index.js";
import { HIRAGANA_BASIC } from "../../data/kana/hiragana.js";
import { rateCard } from "../../srs/scheduler.js";

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

const vocabCards = VOCAB_N5.slice(0, 5);
const kanaCard = HIRAGANA_BASIC[0];

describe("PART A — Export/Import E2E dengan Vocabulary", () => {
  it("full cycle: review → favorite → suspend → export → reset → import", () => {
    // 1-2. Review/rate beberapa vocab card
    const progress: Record<string, ReturnType<typeof rateCard>> = {};
    for (const c of vocabCards.slice(0, 3)) {
      progress[c.id] = rateCard(null, c.id, "good");
    }
    // kana card juga di-review (jangan berubah)
    progress[kanaCard.id] = rateCard(null, kanaCard.id, "easy");
    saveProgress(progress);

    // 3. Favorite beberapa vocab
    toggleFavorite(vocabCards[0].id);
    toggleFavorite(vocabCards[1].id);

    // 4. Suspend satu vocab
    setSuspended(vocabCards[2].id, true);

    // 5. Progress berubah
    expect(Object.keys(loadProgress()).length).toBe(4);

    // 6. Record study history
    recordReview("good");
    const statsBefore = loadStats();
    expect(statsBefore.days).toBeDefined();

    // 7. Export
    const exported = exportAll();
    expect(exported).toContain("vocab-n5-");

    // 8. Reset
    resetAll();
    expect(Object.keys(loadProgress()).length).toBe(0);

    // 9. Import kembali
    const result = importAll(exported);
    expect(result.ok).toBe(true);

    // 10. Verifikasi
    const afterProgress = loadProgress();
    // SRS state kembali
    expect(afterProgress[vocabCards[0].id]?.state).toBe("learning");
    expect(afterProgress[kanaCard.id]?.state).toBe("review");
    // favorite kembali
    const meta = loadCardMeta();
    expect(meta[vocabCards[0].id]?.favorite).toBe(true);
    expect(meta[vocabCards[1].id]?.favorite).toBe(true);
    // suspend kembali
    expect(meta[vocabCards[2].id]?.suspended).toBe(true);
    // vocabulary tetap valid
    expect(VOCAB_N5.find((c) => c.id === vocabCards[0].id)).toBeDefined();
  });

  it("old export tanpa vocabulary → import tetap PASS", () => {
    // simulasi export lama: hanya kana, tanpa vocab
    const progress: Record<string, ReturnType<typeof rateCard>> = {};
    progress[kanaCard.id] = rateCard(null, kanaCard.id, "good");
    saveProgress(progress);

    const exported = exportAll();
    expect(exported).not.toContain("vocab-n5-");

    resetAll();
    const result = importAll(exported);
    expect(result.ok).toBe(true);
    expect(loadProgress()[kanaCard.id]).toBeDefined();
  });

  it("export dengan vocabulary → import ulang PASS (idempotent)", () => {
    const progress: Record<string, ReturnType<typeof rateCard>> = {};
    progress[vocabCards[0].id] = rateCard(null, vocabCards[0].id, "good");
    saveProgress(progress);
    toggleFavorite(vocabCards[0].id);

    const e1 = exportAll();
    importAll(e1);
    const e2 = exportAll();
    // import ulang hasil export kedua
    resetAll();
    const result = importAll(e2);
    expect(result.ok).toBe(true);
    expect(loadProgress()[vocabCards[0].id]?.state).toBe("learning");
    expect(loadCardMeta()[vocabCards[0].id]?.favorite).toBe(true);
  });
});
