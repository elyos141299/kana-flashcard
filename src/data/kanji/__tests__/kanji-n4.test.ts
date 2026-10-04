import { describe, it, expect } from "vitest";
import { selectKanji, countKanji, KANJI_N5, KANJI_N4 } from "../index.js";

describe("integritas dataset kanji N4 (§5, §13)", () => {
  it("N4 total > 0", () => {
    expect(KANJI_N4.length).toBeGreaterThan(0);
  });

  it("semua kanji N4 punya ID unik", () => {
    const ids = KANJI_N4.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada karakter kanji duplikat dalam N4", () => {
    const chars = KANJI_N4.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("level selalu N4, type selalu kanji", () => {
    for (const c of KANJI_N4) {
      expect(c.level).toBe("N4");
      expect(c.type).toBe("kanji");
    }
  });

  it("setiap kanji N4 punya minimal 1 meaning", () => {
    for (const c of KANJI_N4) {
      expect(c.meanings.length, c.id).toBeGreaterThan(0);
      expect(c.meanings.every((m) => m.length > 0)).toBe(true);
    }
  });

  it("setiap kanji N4 punya minimal 1 reading valid", () => {
    for (const c of KANJI_N4) {
      expect(c.onyomi.length + c.kunyomi.length, c.id).toBeGreaterThan(0);
    }
  });

  it("tidak ada notasi dictionary yang bocor ke reading", () => {
    for (const c of KANJI_N4) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).not.toMatch(/^[-.]/);
        expect(r, c.id).not.toMatch(/[-.]$/);
        expect(r, c.id).not.toContain(".");
      }
    }
  });

  it("examples valid: word + reading + meaning, tidak kosong", () => {
    for (const c of KANJI_N4) {
      expect(c.examples.length, c.id).toBeGreaterThan(0);
      expect(c.examples.length, c.id).toBeLessThanOrEqual(3);
      for (const ex of c.examples) {
        expect(ex.word.length, c.id).toBeGreaterThan(0);
        expect(ex.reading.length, c.id).toBeGreaterThan(0);
        expect(ex.meaning.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("ID N4 berformat kanji-n4-NNN dan tidak tabrakan dengan N5", () => {
    const n5ids = new Set(KANJI_N5.map((c) => c.id));
    KANJI_N4.forEach((c, i) => {
      expect(c.id).toBe(`kanji-n4-${String(i + 1).padStart(3, "0")}`);
      expect(n5ids.has(c.id)).toBe(false);
    });
  });
});

describe("selectKanji (§13)", () => {
  it('selectKanji("N5") mengembalikan dataset N5 yang benar', () => {
    const cards = selectKanji("N5");
    expect(cards.length).toBe(countKanji("N5"));
    expect(cards.every((c) => c.level === "N5")).toBe(true);
  });

  it('selectKanji("N4") mengembalikan dataset N4 yang benar', () => {
    const cards = selectKanji("N4");
    expect(cards.length).toBe(countKanji("N4"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.level === "N4")).toBe(true);
  });

  it("countKanji dihitung dari dataset aktual (tidak hard-code)", () => {
    expect(countKanji("N4")).toBe(KANJI_N4.length);
    expect(countKanji("N5")).toBe(KANJI_N5.length);
  });
});
