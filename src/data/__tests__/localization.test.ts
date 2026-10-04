/**
 * Localization regression (Phase 22).
 * - Entri yang diperbaiki sesuai expected (lowercase natural Indonesian).
 * - Card ID tidak berubah; readings tidak berubah; struktur example valid.
 * - Bukan "semua string harus Indonesian" — kana/romaji/akronim valid.
 */
import { describe, it, expect } from "vitest";
import {
  KANJI_N5,
  KANJI_N4,
  KANJI_N3,
  KANJI_N2,
  KANJI_N1,
} from "../kanji/index.js";
import { getCardById } from "../cards.js";

const ALL = [...KANJI_N5, ...KANJI_N4, ...KANJI_N3, ...KANJI_N2, ...KANJI_N1];

function exampleMeanings(cardId: string): string[] {
  const card = getCardById(cardId);
  if (!card || card.type !== "kanji") throw new Error(`card not found: ${cardId}`);
  return card.examples.map((e) => e.meaning);
}

describe("localization fixes (Phase 22)", () => {
  it("ALL-CAPS dinormalisasi ke lowercase", () => {
    expect(exampleMeanings("kanji-n5-044")).toContain("film");
    expect(exampleMeanings("kanji-n5-044")).toContain("bioskop");
    expect(exampleMeanings("kanji-n5-048")).toContain("daging sapi");
  });

  it("akronim dipertahankan: ASI", () => {
    const meanings = exampleMeanings("kanji-n5-032");
    expect(meanings.some((m) => m.includes("ASI"))).toBe(true);
  });

  it("Title Case dinormalisasi", () => {
    expect(exampleMeanings("kanji-n4-068")).toContain("mencuci (barang)");
    expect(exampleMeanings("kanji-n3-134")).toContain("memberikan (penghargaan)");
  });

  it("typo diperbaiki", () => {
    expect(exampleMeanings("kanji-n4-046")).toContain("mendaftarkan diri");
    expect(exampleMeanings("kanji-n4-132")).toContain("membayar");
    expect(exampleMeanings("kanji-n3-121")).toContain("meletakkan");
  });

  it("artefak source dibersihkan", () => {
    const m281 = exampleMeanings("kanji-n3-281").join(" | ");
    expect(m281).not.toMatch(/\( mesin \) 2/);
    const m207 = exampleMeanings("kanji-n3-207").join(" | ");
    expect(m207).not.toMatch(/MUDA/);
  });

  it("proper noun tetap kapital", () => {
    expect(exampleMeanings("kanji-n5-001")).toContain("Jepang");
    expect(exampleMeanings("kanji-n4-154")).toContain("Eropa");
  });

  it("disambiguasi dalam kurung dipertahankan", () => {
    const n5 = KANJI_N5.find((c) => c.id === "kanji-n5-101")!;
    expect(n5.examples[0].meaning).toBe("panas (cuaca); panas (suhu)");
  });

  it("prefix marker dipertahankan: ke-, non-", () => {
    const dai = KANJI_N3.find((c) => c.id === "kanji-n3-069")!;
    expect(dai.meanings).toContain("ke-");
    const hi = KANJI_N3.find((c) => c.id === "kanji-n3-218")!;
    expect(hi.meanings).toContain("non-");
  });

  it("readings tidak berubah oleh localization", () => {
    const card = KANJI_N4.find((c) => c.id === "kanji-n4-046")!;
    expect(card.onyomi).toContain("しん");
    expect(card.kunyomi).toEqual(expect.arrayContaining(["もうす"]));
  });

  it("struktur example tetap valid", () => {
    for (const c of ALL) {
      for (const ex of c.examples) {
        expect(typeof ex.word).toBe("string");
        expect(typeof ex.reading).toBe("string");
        expect(typeof ex.meaning).toBe("string");
        expect(ex.word.length).toBeGreaterThan(0);
      }
    }
  });

  it("tidak ada ALL-CAPS tersisa kecuali akronim", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      for (const ex of c.examples) {
        if (/^[^a-zà-ÿ]*$/.test(ex.meaning) && /[A-Z]/.test(ex.meaning) && !/\bASI\b/.test(ex.meaning)) {
          bad.push(`${c.id}: ${ex.meaning}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
