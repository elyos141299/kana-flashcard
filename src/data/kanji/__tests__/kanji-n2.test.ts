import { describe, it, expect } from "vitest";
import { selectKanji, countKanji, KANJI_N2 } from "../index.js";

describe("integritas dataset kanji N2 (§7, §17)", () => {
  it("N2 total > 0", () => {
    expect(KANJI_N2.length).toBeGreaterThan(0);
  });

  it("semua kanji N2 punya ID unik", () => {
    const ids = KANJI_N2.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada karakter kanji duplikat dalam N2", () => {
    const chars = KANJI_N2.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("level selalu N2, type selalu kanji", () => {
    for (const c of KANJI_N2) {
      expect(c.level).toBe("N2");
      expect(c.type).toBe("kanji");
    }
  });

  it("setiap kanji N2 punya meaning valid", () => {
    for (const c of KANJI_N2) {
      expect(c.meanings.length, c.id).toBeGreaterThan(0);
      expect(c.meanings.every((m) => m.length > 0)).toBe(true);
    }
  });

  it("setiap kanji N2 punya minimal 1 reading valid", () => {
    for (const c of KANJI_N2) {
      expect(c.onyomi.length + c.kunyomi.length, c.id).toBeGreaterThan(0);
    }
  });

  it("tidak ada notasi dictionary yang bocor ke reading", () => {
    for (const c of KANJI_N2) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).not.toMatch(/^[-.]/);
        expect(r, c.id).not.toMatch(/[-.]$/);
        expect(r, c.id).not.toContain(".");
      }
    }
  });

  it("tidak ada reading vocabulary yang tercampur ke ON/KUN", () => {
    // ON/KUN harus bacaan kanji murni (kana), bukan gabungan kata
    for (const c of KANJI_N2) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).toMatch(/^[\u3040-\u309f\u30a0-\u30ffー・]+$/);
      }
    }
  });

  it("examples valid bila tersedia: word + reading + meaning", () => {
    for (const c of KANJI_N2) {
      expect(c.examples.length, c.id).toBeLessThanOrEqual(3);
      for (const ex of c.examples) {
        expect(ex.word.length, c.id).toBeGreaterThan(0);
        expect(ex.reading.length, c.id).toBeGreaterThan(0);
        expect(ex.meaning.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("ID N2 berformat kanji-n2-NNN", () => {
    KANJI_N2.forEach((c, i) => {
      expect(c.id).toBe(`kanji-n2-${String(i + 1).padStart(3, "0")}`);
    });
  });
});

describe("selectKanji N2 (§17)", () => {
  it('selectKanji("N2") hanya mengembalikan N2', () => {
    const cards = selectKanji("N2");
    expect(cards.length).toBe(countKanji("N2"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.level === "N2")).toBe(true);
  });

  it("countKanji N2 dari dataset aktual (tidak hard-code)", () => {
    expect(countKanji("N2")).toBe(KANJI_N2.length);
  });
});
