import { describe, it, expect } from "vitest";
import {
  selectKana,
  HIRAGANA_ALL,
  KATAKANA_ALL,
  GROUP_SIZES,
} from "../index.js";
import type { KanaScript, KanaGroup } from "../types.js";

const SCRIPTS: KanaScript[] = ["hiragana", "katakana"];
const ALL = [...HIRAGANA_ALL, ...KATAKANA_ALL];

describe("jumlah dataset (§13)", () => {
  it.each([
    ["hiragana", "basic", 46],
    ["katakana", "basic", 46],
    ["hiragana", "dakuten", 20],
    ["katakana", "dakuten", 20],
    ["hiragana", "handakuten", 5],
    ["katakana", "handakuten", 5],
    ["hiragana", "combination", 33],
    ["katakana", "combination", 33],
    ["hiragana", "small", 9],
    ["katakana", "small", 9],
  ] as Array<[KanaScript, KanaGroup, number]>)(
    "%s %s = %d kartu",
    (script, group, expected) => {
      expect(selectKana(script, group)).toHaveLength(expected);
      expect(GROUP_SIZES[group]).toBe(expected);
    },
  );

  it("total 226 kartu (113 per script)", () => {
    expect(HIRAGANA_ALL).toHaveLength(113);
    expect(KATAKANA_ALL).toHaveLength(113);
    expect(ALL).toHaveLength(226);
  });
});

describe("integritas dataset", () => {
  it("tidak ada duplicate ID", () => {
    const ids = ALL.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tidak ada duplicate character dalam script+group yang sama", () => {
    for (const script of SCRIPTS) {
      for (const group of Object.keys(GROUP_SIZES) as KanaGroup[]) {
        const chars = selectKana(script, group).map((c) => c.character);
        expect(new Set(chars).size, `${script}/${group}`).toBe(chars.length);
      }
    }
  });

  it("semua card punya script dan group yang valid", () => {
    for (const c of ALL) {
      expect(["hiragana", "katakana"]).toContain(c.script);
      expect(["basic", "dakuten", "handakuten", "combination", "small"]).toContain(c.group);
      expect(c.type).toBe("kana");
    }
  });

  it("semua card punya romaji, kecuali っ/ッ yang punya note", () => {
    for (const c of ALL) {
      if (c.character === "っ" || c.character === "ッ") {
        expect(c.romaji).toBe("");
        expect(c.note).toBeTruthy();
      } else {
        expect(c.romaji.length, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("ぢ/づ dan ヂ/ヅ punya romaji ji/zu tapi tetap entri terpisah", () => {
    const ji = HIRAGANA_ALL.filter((c) => c.romaji === "ji").map((c) => c.character);
    expect(ji).toContain("じ");
    expect(ji).toContain("ぢ");
    const zu = HIRAGANA_ALL.filter((c) => c.romaji === "zu").map((c) => c.character);
    expect(zu).toContain("ず");
    expect(zu).toContain("づ");
  });
});

describe("romaji combination valid (spot check)", () => {
  const expected: Record<string, string> = {
    "きゃ": "kya", "しゅ": "shu", "ちょ": "cho",
    "にょ": "nyo", "ひゃ": "hya", "みゅ": "myu",
    "りょ": "ryo", "ぎょ": "gyo", "じゃ": "ja",
    "びゅ": "byu", "ぴょ": "pyo",
    "キャ": "kya", "シュ": "shu", "チョ": "cho",
    "ジョ": "jo", "ピョ": "pyo",
  };
  it.each(Object.entries(expected))("%s → %s", (character, romaji) => {
    const card = ALL.find((c) => c.character === character);
    expect(card).toBeDefined();
    expect(card!.romaji).toBe(romaji);
  });
});

describe("selectKana integration (§15)", () => {
  it("mengembalikan kartu group yang benar", () => {
    const cards = selectKana("hiragana", "dakuten");
    expect(cards.every((c) => c.group === "dakuten" && c.script === "hiragana")).toBe(true);
    expect(cards[0].character).toBe("が");
  });

  it('"all" menggabungkan semua group berurutan', () => {
    const all = selectKana("katakana", "all");
    expect(all).toHaveLength(113);
    // urutan: basic dulu, small terakhir
    expect(all[0].group).toBe("basic");
    expect(all[45].group).toBe("basic");
    expect(all[46].group).toBe("dakuten");
    expect(all[all.length - 1].group).toBe("small");
    expect(all[all.length - 1].character).toBe("ッ");
  });

  it("urutan deterministic sesuai dataset", () => {
    const a = selectKana("hiragana", "basic").map((c) => c.character).join("");
    expect(a.startsWith("あいうえお")).toBe(true);
    expect(a.endsWith("わをん")).toBe(true);
  });
});
