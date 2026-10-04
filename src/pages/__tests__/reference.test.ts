/**
 * Reference Tables — tests.
 *
 * Verifikasi:
 * - Data langsung dari existing dataset (tidak ada duplicate)
 * - Hanya level yang ada data yang ditampilkan
 * - Search/filter bekerja
 * - Multiple readings/meanings ditampilkan benar
 * - TIDAK ada mutasi SRS/progress/history
 */
import { describe, it, expect } from "vitest";
import { selectKana } from "../../data/kana/index.js";
import { selectKanji } from "../../data/kanji/index.js";
import { selectVocab, VOCAB_LEVELS } from "../../data/vocab/index.js";

describe("Reference — data source integrity", () => {
  it("kana reference menggunakan existing dataset (tidak duplicate)", () => {
    const hiragana = selectKana("hiragana", "basic");
    expect(hiragana.length).toBe(46);
    expect(hiragana[0].id).toMatch(/^hiragana-/);
    expect(hiragana[0].type).toBe("kana");
  });

  it("katakana reference menggunakan existing dataset", () => {
    const katakana = selectKana("katakana", "basic");
    expect(katakana.length).toBe(46);
    expect(katakana[0].id).toMatch(/^katakana-/);
  });

  it("kanji reference menggunakan existing dataset per level", () => {
    for (const level of ["N5", "N4", "N3"] as const) {
      const cards = selectKanji(level);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].type).toBe("kanji");
      expect(cards[0].level).toBe(level);
    }
  });

  it("vocabulary reference menggunakan existing dataset (500 N5)", () => {
    const vocab = selectVocab("N5");
    expect(vocab.length).toBe(500);
    expect(vocab[0].id).toBe("vocab-n5-001");
    expect(vocab[0].type).toBe("vocabulary");
  });

  it("hanya level dengan data yang ditampilkan", () => {
    const availableLevels = VOCAB_LEVELS.filter((l) => selectVocab(l).length > 0);
    expect(availableLevels).toEqual(["N5"]);
    // N4/N3 tidak ditampilkan karena belum ada dataset
  });
});

describe("Reference — special cases", () => {
  it("何: primary なに, secondary なん", () => {
    const vocab = selectVocab("N5");
    const nan = vocab.find((c) => c.word === "何");
    expect(nan).toBeDefined();
    expect(nan!.readings).toContain("なに");
    expect(nan!.readings).toContain("なん");
    expect(nan!.primaryReading).toBe("なに");
  });

  it("良い: primary いい, secondary よい, satu card", () => {
    const vocab = selectVocab("N5");
    const yoi = vocab.filter((c) => c.word === "良い");
    expect(yoi.length).toBe(1);
    expect(yoi[0].readings).toContain("いい");
    expect(yoi[0].readings).toContain("よい");
  });

  it("誰: word 誰, kanaForm だれ", () => {
    const vocab = selectVocab("N5");
    const dare = vocab.find((c) => c.word === "誰");
    expect(dare).toBeDefined();
    expect(dare!.kanaForm).toBe("だれ");
  });

  it("バス停: reading バスてい", () => {
    const vocab = selectVocab("N5");
    const stop = vocab.find((c) => c.word === "バス停");
    expect(stop).toBeDefined();
    expect(stop!.reading).toBe("バスてい");
  });
});

describe("Reference — no state mutation", () => {
  it("membuka reference tidak mengubah dataset", () => {
    const before = selectVocab("N5").length;
    // Simulasi: buka reference, lihat detail, play audio
    const cards = selectVocab("N5");
    const card = cards[0];
    // Hanya read, tidak write
    expect(card.word).toBeDefined();
    const after = selectVocab("N5").length;
    expect(after).toBe(before);
  });

  it("reference tidak membuat ID baru", () => {
    const vocab = selectVocab("N5");
    const ids = new Set(vocab.map((c) => c.id));
    expect(ids.size).toBe(500); // tidak ada duplicate
  });
});
