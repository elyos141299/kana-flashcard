/**
 * PART B — Audio Edge Cases untuk Vocabulary.
 *
 * CARD AUDIO → primaryReading
 * EXAMPLE AUDIO → example.usedReading
 *
 * Jangan sampai example これは何ですか dibacakan dengan なに
 * ketika example memakai なん.
 */
import { describe, it, expect } from "vitest";
import { VOCAB_N5 } from "../index.js";

/** Logic yang dipakai VocabFlashcard untuk menentukan teks audio. */
function cardAudioText(card: (typeof VOCAB_N5)[number]): string {
  return card.primaryReading ?? card.reading;
}

function exampleAudioText(ex: { sentence: string; usedReading?: string }): string {
  return ex.usedReading ?? ex.sentence;
}

describe("PART B — Audio Edge Cases", () => {
  describe("normal: 食べる", () => {
    it("card audio = たべる", () => {
      const card = VOCAB_N5.find((c) => c.word === "食べる")!;
      expect(cardAudioText(card)).toBe("たべる");
    });
  });

  describe("multiple reading: 何", () => {
    it("card audio = primaryReading (なに)", () => {
      const card = VOCAB_N5.find((c) => c.word === "何")!;
      expect(card.primaryReading).toBe("なに");
      expect(cardAudioText(card)).toBe("なに");
    });
    it("example audio = usedReading (なん), bukan なに", () => {
      const card = VOCAB_N5.find((c) => c.word === "何")!;
      const ex = card.examples![0];
      expect(ex.usedReading).toBe("なん");
      expect(exampleAudioText(ex)).toBe("なん");
      expect(exampleAudioText(ex)).not.toBe("なに");
    });
  });

  describe("multiple reading: 良い", () => {
    it("card audio = primaryReading (いい)", () => {
      const card = VOCAB_N5.find((c) => c.word === "良い")!;
      expect(card.primaryReading).toBe("いい");
      expect(cardAudioText(card)).toBe("いい");
    });
    it("satu card, satu ID (tidak duplicate)", () => {
      const cards = VOCAB_N5.filter((c) => c.word === "良い");
      expect(cards.length).toBe(1);
    });
    it("secondary reading tetap valid", () => {
      const card = VOCAB_N5.find((c) => c.word === "良い")!;
      expect(card.readings).toContain("よい");
    });
  });

  describe("example tanpa usedReading", () => {
    it("fallback ke sentence", () => {
      const ex = { sentence: "これは本です。" };
      expect(exampleAudioText(ex)).toBe("これは本です。");
    });
  });
});
