/**
 * Reading & example integrity regression (Phase 23).
 * - Semua reading kana-valid, tidak ada marker mentah, tidak ada duplikat identik.
 * - Semua example: word/reading/meaning non-empty, reading kana-valid.
 * - Kandidat yang sudah direview manual dan dinyatakan VALID didokumentasikan di sini.
 */
import { describe, it, expect } from "vitest";
import {
  KANJI_N5,
  KANJI_N4,
  KANJI_N3,
  KANJI_N2,
  KANJI_N1,
} from "../kanji/index.js";

const ALL = [...KANJI_N5, ...KANJI_N4, ...KANJI_N3, ...KANJI_N2, ...KANJI_N1];
const KANA_RE = /^[\u3041-\u3096\u309d\u309e\u30a1-\u30fa\u30fc-\u30fe]+$/;
const HAS_JP_RE = /[\u3041-\u3096\u30a1-\u30fa\u4e00-\u9faf\u3400-\u4dbf]/;

describe("reading structure (Phase 23)", () => {
  it("semua reading kana-valid dan non-empty", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      for (const [fname, arr] of [
        ["onyomi", c.onyomi],
        ["kunyomi", c.kunyomi],
        ["commonReadings", c.commonReadings],
      ] as const) {
        arr.forEach((r, i) => {
          if (!r || !KANA_RE.test(r)) bad.push(`${c.id} ${fname}[${i}]=${r}`);
        });
      }
    }
    expect(bad).toEqual([]);
  });

  it("tidak ada raw dictionary marker pada reading", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      for (const r of [...c.onyomi, ...c.kunyomi, ...c.commonReadings]) {
        if (/[*~()[\];]/.test(r)) bad.push(`${c.id}: ${r}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("tidak ada duplikat reading identik dalam satu field", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      for (const [fname, arr] of [
        ["onyomi", c.onyomi],
        ["kunyomi", c.kunyomi],
        ["commonReadings", c.commonReadings],
      ] as const) {
        if (new Set(arr).size !== arr.length) bad.push(`${c.id} ${fname}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("commonReadings berasal dari on/kun card", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      const pool = new Set([...c.onyomi, ...c.kunyomi]);
      for (const r of c.commonReadings) {
        if (!pool.has(r)) bad.push(`${c.id}: ${r}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("example structure (Phase 23)", () => {
  it("word/reading/meaning non-empty; reading kana-valid", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      c.examples.forEach((ex, i) => {
        if (!ex.word || !HAS_JP_RE.test(ex.word))
          bad.push(`${c.id} ex[${i}] bad word: ${ex.word}`);
        if (!ex.reading || !KANA_RE.test(ex.reading))
          bad.push(`${c.id} ex[${i}] bad reading: ${ex.reading}`);
        if (!ex.meaning) bad.push(`${c.id} ex[${i}] empty meaning`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("tidak ada duplikat example identik dalam satu card", () => {
    const bad: string[] = [];
    for (const c of ALL) {
      const keys = c.examples.map((e) => `${e.word}|${e.reading}`);
      if (new Set(keys).size !== keys.length) bad.push(c.id);
    }
    expect(bad).toEqual([]);
  });
});

describe("reviewed candidates (Phase 23 manual review)", () => {
  it("counter ~階 dipertahankan (notasi counter Jepang standar)", () => {
    const c = KANJI_N3.find((x) => x.id === "kanji-n3-235")!;
    expect(c.examples[0].word).toBe("~階");
    expect(c.examples[0].reading).toBe("かい");
  });

  it("example berbagi reading KUN valid meski tanpa kanji card", () => {
    const ryou = KANJI_N2.find((x) => x.id === "kanji-n2-078")!;
    expect(ryou.examples[0]).toMatchObject({ word: "篝火", reading: "かがりび" });
    expect(ryou.kunyomi).toContain("かがりび");

    const saki = KANJI_N2.find((x) => x.id === "kanji-n2-117")!;
    expect(saki.examples[0]).toMatchObject({ word: "岬", reading: "みさき" });
    expect(saki.kunyomi).toContain("みさき");

    const chi = KANJI_N2.find((x) => x.id === "kanji-n2-254")!;
    expect(chi.examples[0]).toMatchObject({ word: "知恵", reading: "ちえ" });
    expect(chi.onyomi).toContain("ち");
  });
});
