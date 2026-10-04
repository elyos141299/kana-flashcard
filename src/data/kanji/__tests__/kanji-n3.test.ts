import { describe, it, expect } from "vitest";
import { selectKanji, countKanji, KANJI_N5, KANJI_N4, KANJI_N3, KANJI_N2, KANJI_N1 } from "../index.js";
import type { KanjiCard, KanjiLevel } from "../types.js";

interface LevelSet { level: KanjiLevel; cards: KanjiCard[]; }

/** Utilitas validasi antar-level: tambah entri untuk level baru. */
const ALL_LEVELS: LevelSet[] = [
  { level: "N5", cards: KANJI_N5 },
  { level: "N4", cards: KANJI_N4 },
  { level: "N3", cards: KANJI_N3 },
  { level: "N2", cards: KANJI_N2 },
  { level: "N1", cards: KANJI_N1 },
];

describe("cross-level integrity (§6)", () => {
  it("setiap level: karakter ∩ karakter level lain = empty", () => {
    for (let i = 0; i < ALL_LEVELS.length; i++) {
      for (let j = i + 1; j < ALL_LEVELS.length; j++) {
        const a = ALL_LEVELS[i];
        const b = ALL_LEVELS[j];
        const setA = new Set(a.cards.map((c) => c.character));
        const overlap = b.cards.filter((c) => setA.has(c.character));
        expect(
          overlap.map((c) => c.character),
          `${a.level} ∩ ${b.level} harus kosong`
        ).toEqual([]);
      }
    }
  });

  it("setiap level: ID unik lintas level", () => {
    const ids = ALL_LEVELS.flatMap((l) => l.cards.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("N5 ∩ N4 = ∅ (tetap PASS)", () => {
    const n5 = new Set(KANJI_N5.map((c) => c.character));
    expect(KANJI_N4.filter((c) => n5.has(c.character))).toEqual([]);
  });

  it("N3 ∩ N5 = ∅", () => {
    const n5 = new Set(KANJI_N5.map((c) => c.character));
    expect(KANJI_N3.filter((c) => n5.has(c.character))).toEqual([]);
  });

  it("N3 ∩ N4 = ∅", () => {
    const n4 = new Set(KANJI_N4.map((c) => c.character));
    expect(KANJI_N3.filter((c) => n4.has(c.character))).toEqual([]);
  });

  it("N2 ∩ N5 = ∅", () => {
    const n5 = new Set(KANJI_N5.map((c) => c.character));
    expect(KANJI_N2.filter((c) => n5.has(c.character))).toEqual([]);
  });

  it("N2 ∩ N4 = ∅", () => {
    const n4 = new Set(KANJI_N4.map((c) => c.character));
    expect(KANJI_N2.filter((c) => n4.has(c.character))).toEqual([]);
  });

  it("N2 ∩ N3 = ∅", () => {
    const n3 = new Set(KANJI_N3.map((c) => c.character));
    expect(KANJI_N2.filter((c) => n3.has(c.character))).toEqual([]);
  });

  it("N1 ∩ N5 = ∅", () => {
    const n5 = new Set(KANJI_N5.map((c) => c.character));
    expect(KANJI_N1.filter((c) => n5.has(c.character))).toEqual([]);
  });

  it("N1 ∩ N4 = ∅", () => {
    const n4 = new Set(KANJI_N4.map((c) => c.character));
    expect(KANJI_N1.filter((c) => n4.has(c.character))).toEqual([]);
  });

  it("N1 ∩ N3 = ∅", () => {
    const n3 = new Set(KANJI_N3.map((c) => c.character));
    expect(KANJI_N1.filter((c) => n3.has(c.character))).toEqual([]);
  });

  it("N1 ∩ N2 = ∅", () => {
    const n2 = new Set(KANJI_N2.map((c) => c.character));
    expect(KANJI_N1.filter((c) => n2.has(c.character))).toEqual([]);
  });
});

describe("integritas dataset kanji N3 (§5, §13)", () => {
  it("N3 total > 0", () => {
    expect(KANJI_N3.length).toBeGreaterThan(0);
  });

  it("semua kanji N3 punya ID unik", () => {
    const ids = KANJI_N3.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada karakter kanji duplikat dalam N3", () => {
    const chars = KANJI_N3.map((c) => c.character);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("level selalu N3, type selalu kanji", () => {
    for (const c of KANJI_N3) {
      expect(c.level).toBe("N3");
      expect(c.type).toBe("kanji");
    }
  });

  it("setiap kanji N3 punya meaning valid", () => {
    for (const c of KANJI_N3) {
      expect(c.meanings.length, c.id).toBeGreaterThan(0);
      expect(c.meanings.every((m) => m.length > 0)).toBe(true);
    }
  });

  it("setiap kanji N3 punya minimal 1 reading valid", () => {
    for (const c of KANJI_N3) {
      expect(c.onyomi.length + c.kunyomi.length, c.id).toBeGreaterThan(0);
    }
  });

  it("tidak ada notasi dictionary yang bocor ke reading", () => {
    for (const c of KANJI_N3) {
      for (const r of [...c.onyomi, ...c.kunyomi]) {
        expect(r, c.id).not.toMatch(/^[-.]/);
        expect(r, c.id).not.toMatch(/[-.]$/);
        expect(r, c.id).not.toContain(".");
      }
    }
  });

  it("examples valid bila tersedia: word + reading + meaning", () => {
    for (const c of KANJI_N3) {
      expect(c.examples.length, c.id).toBeLessThanOrEqual(3);
      for (const ex of c.examples) {
        expect(ex.word.length, c.id).toBeGreaterThan(0);
        expect(ex.reading.length, c.id).toBeGreaterThan(0);
        expect(ex.meaning.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("ID N3 berformat kanji-n3-NNN", () => {
    KANJI_N3.forEach((c, i) => {
      expect(c.id).toBe(`kanji-n3-${String(i + 1).padStart(3, "0")}`);
    });
  });
});

describe("selectKanji N3 (§13)", () => {
  it('selectKanji("N3") hanya mengembalikan N3', () => {
    const cards = selectKanji("N3");
    expect(cards.length).toBe(countKanji("N3"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.level === "N3")).toBe(true);
  });

  it("countKanji N3 dari dataset aktual", () => {
    expect(countKanji("N3")).toBe(KANJI_N3.length);
  });
});
