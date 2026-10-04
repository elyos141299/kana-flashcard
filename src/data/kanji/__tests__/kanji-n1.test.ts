import { describe, it, expect } from "vitest";
import { selectKanji, countKanji, KANJI_N1 } from "../index.js";

describe("integritas dataset kanji N1 (§16)", () => {
  it("N1 total > 0", () => {
    expect(KANJI_N1.length).toBeGreaterThan(0);
  });

  it("semua kanji N1 punya ID unik", () => {
    const ids = KANJI_N1.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada karakter kanji duplikat dalam N1", () => {
    const chars = KANJI_N1.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("level selalu N1, type selalu kanji", () => {
    for (const c of KANJI_N1) {
      expect(c.level).toBe("N1");
      expect(c.type).toBe("kanji");
    }
  });

  it("setiap kanji N1 punya meanings valid", () => {
    for (const c of KANJI_N1) {
      expect(c.meanings.length, c.id).toBeGreaterThan(0);
      expect(c.meanings.every((m) => m.length > 0)).toBe(true);
    }
  });

  it("setiap kanji N1 punya readings valid", () => {
    for (const c of KANJI_N1) {
      expect(c.onyomi.length + c.kunyomi.length, c.id).toBeGreaterThan(0);
    }
  });

  it("tidak ada notasi dictionary yang bocor", () => {
    for (const c of KANJI_N1) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).not.toMatch(/^[-.]/);
        expect(r, c.id).not.toMatch(/[-.]$/);
        expect(r, c.id).not.toContain(".");
      }
    }
  });

  it("tidak ada reading vocabulary yang tercampur ke ON/KUN", () => {
    for (const c of KANJI_N1) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).toMatch(/^[\u3040-\u309f\u30a0-\u30ffー・]+$/);
      }
    }
  });

  it("examples valid bila tersedia (§8: boleh kosong, jangan mengarang)", () => {
    for (const c of KANJI_N1) {
      expect(c.examples.length, c.id).toBeLessThanOrEqual(3);
      for (const ex of c.examples) {
        expect(ex.word.length, c.id).toBeGreaterThan(0);
        expect(ex.reading.length, c.id).toBeGreaterThan(0);
        expect(ex.meaning.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("ID N1 berformat kanji-n1-NNN", () => {
    KANJI_N1.forEach((c, i) => {
      expect(c.id).toBe(`kanji-n1-${String(i + 1).padStart(3, "0")}`);
    });
  });
});

describe("selectKanji N1", () => {
  it('selectKanji("N1") hanya mengembalikan N1', () => {
    const cards = selectKanji("N1");
    expect(cards.length).toBe(countKanji("N1"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.level === "N1")).toBe(true);
  });

  it("countKanji N1 dari dataset aktual (tidak hard-code)", () => {
    expect(countKanji("N1")).toBe(KANJI_N1.length);
  });
});
