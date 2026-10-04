import { describe, it, expect } from "vitest";
import { selectKanji, countKanji, KANJI_N5 } from "../index.js";

describe("integritas dataset kanji (§15)", () => {
  it("semua kanji punya ID unik", () => {
    const ids = KANJI_N5.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada karakter kanji duplikat", () => {
    const chars = KANJI_N5.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("level selalu N5", () => {
    for (const c of KANJI_N5) {
      expect(c.level).toBe("N5");
      expect(c.type).toBe("kanji");
    }
  });

  it("setiap kanji punya minimal 1 meaning", () => {
    for (const c of KANJI_N5) {
      expect(c.meanings.length, c.id).toBeGreaterThan(0);
      expect(c.meanings.every((m) => m.length > 0)).toBe(true);
    }
  });

  it("setiap kanji punya minimal 1 reading valid (on/kun)", () => {
    for (const c of KANJI_N5) {
      const total = c.onyomi.length + c.kunyomi.length;
      expect(total, c.id).toBeGreaterThan(0);
    }
  });

  it("examples punya word, reading, dan meaning", () => {
    for (const c of KANJI_N5) {
      expect(c.examples.length, c.id).toBeGreaterThan(0);
      for (const ex of c.examples) {
        expect(ex.word.length, c.id).toBeGreaterThan(0);
        expect(ex.reading.length, c.id).toBeGreaterThan(0);
        expect(ex.meaning.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("tidak ada malformed data (field wajib bertipe benar)", () => {
    for (const c of KANJI_N5) {
      expect(typeof c.character).toBe("string");
      expect(Array.isArray(c.onyomi)).toBe(true);
      expect(Array.isArray(c.kunyomi)).toBe(true);
      expect(Array.isArray(c.commonReadings)).toBe(true);
      expect(c.commonReadings.length).toBeGreaterThan(0);
    }
  });

  it("ID berurutan dan terformat kanji-n5-NNN", () => {
    KANJI_N5.forEach((c, i) => {
      expect(c.id).toBe(`kanji-n5-${String(i + 1).padStart(3, "0")}`);
    });
  });
});

describe("selectKanji", () => {
  it("mengembalikan kartu N5 dengan urutan deterministic", () => {
    const cards = selectKanji("N5");
    expect(cards.length).toBe(countKanji("N5"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.level === "N5")).toBe(true);
  });

  it("countKanji dihitung dari dataset (tidak hard-code)", () => {
    expect(countKanji("N5")).toBe(KANJI_N5.length);
  });
});
