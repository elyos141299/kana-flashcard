/**
 * Card ID stability (Phase 19 §22).
 *
 * Card ID adalah relasi antara dataset dan user progress. Jika ID berubah
 * tanpa migration, progress lama kehilangan relasi. Test ini mengunci:
 * - jumlah kartu per dataset
 * - keunikan ID global
 * - format ID
 * - ID patokan (pin) per dataset — jika dataset sengaja berubah,
 *   test gagal secara eksplisit dan menunjukkan ID yang berubah.
 */
import { describe, it, expect } from "vitest";
import { HIRAGANA_ALL, KATAKANA_ALL } from "../kana/index.js";
import {
  KANJI_N5,
  KANJI_N4,
  KANJI_N3,
  KANJI_N2,
  KANJI_N1,
} from "../kanji/index.js";

const SETS = {
  hiragana: HIRAGANA_ALL,
  katakana: KATAKANA_ALL,
  n5: KANJI_N5,
  n4: KANJI_N4,
  n3: KANJI_N3,
  n2: KANJI_N2,
  n1: KANJI_N1,
} as const;

const EXPECTED_COUNTS = {
  hiragana: 113,
  katakana: 113,
  n5: 114,
  n4: 168,
  n3: 350,
  n2: 543,
  n1: 549,
} as const;

/** ID patokan: [id pertama, id terakhir] per dataset. */
const PINNED_IDS = {
  hiragana: ["hiragana-basic-01", "hiragana-small-09"],
  katakana: ["katakana-basic-01", "katakana-small-09"],
  n5: ["kanji-n5-001", "kanji-n5-114"],
  n4: ["kanji-n4-001", "kanji-n4-168"],
  n3: ["kanji-n3-001", "kanji-n3-350"],
  n2: ["kanji-n2-001", "kanji-n2-543"],
  n1: ["kanji-n1-001", "kanji-n1-549"],
} as const;

describe("card ID stability", () => {
  it("jumlah kartu per dataset tidak berubah", () => {
    for (const [key, cards] of Object.entries(SETS)) {
      expect(cards.length).toBe(
        EXPECTED_COUNTS[key as keyof typeof EXPECTED_COUNTS],
      );
    }
  });

  it("semua ID unik secara global", () => {
    const ids = Object.values(SETS).flat().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("format ID stabil", () => {
    for (const c of [...HIRAGANA_ALL, ...KATAKANA_ALL]) {
      expect(c.id).toMatch(/^(hiragana|katakana)-[a-z]+-\d{2}$/);
    }
    for (const c of [KANJI_N5, KANJI_N4, KANJI_N3, KANJI_N2, KANJI_N1].flat()) {
      expect(c.id).toMatch(/^kanji-n[1-5]-\d{3}$/);
    }
  });

  it("ID patokan tidak berubah", () => {
    for (const [key, cards] of Object.entries(SETS)) {
      const [first, last] = PINNED_IDS[key as keyof typeof PINNED_IDS];
      const ids = new Set(cards.map((c) => c.id));
      expect(ids.has(first)).toBe(true);
      expect(ids.has(last)).toBe(true);
    }
  });

  it("ID deterministic dari urutan dataset (kana)", () => {
    // ね adalah basic ke-24 → hiragana-basic-24
    const ne = HIRAGANA_ALL.find((c) => c.character === "ね")!;
    expect(ne.id).toBe("hiragana-basic-24");
  });
});
