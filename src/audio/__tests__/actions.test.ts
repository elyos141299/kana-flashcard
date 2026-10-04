/**
 * Test audio actions per kartu (Phase 10).
 * Memastikan text yang diucapkan SELALU teks Jepang yang benar.
 */
import { describe, it, expect } from "vitest";
import { getKanaAudioActions, getKanjiAudioActions } from "../actions.js";
import type { KanaCard } from "../../data/kana/index.js";
import type { KanjiCard } from "../../data/kanji/index.js";
import { HIRAGANA_BASIC, HIRAGANA_SMALL, HIRAGANA_COMBINATION } from "../../data/kana/hiragana.js";
import { KANJI_N5 } from "../../data/kanji/n5.js";
import { KANJI_N1 } from "../../data/kanji/n1.js";

describe("getKanaAudioActions", () => {
  it("ね → speak('ね'), bukan romaji", () => {
    const card = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    const [a] = getKanaAudioActions(card);
    expect(a.text).toBe("ね");
    expect(a.label).toContain("ね");
  });

  it("combination きゃ → speak('きゃ')", () => {
    const card = HIRAGANA_COMBINATION.find((c) => c.character === "きゃ")!;
    const [a] = getKanaAudioActions(card);
    expect(a.text).toBe("きゃ");
  });

  it("small kana っ → speak karakter apa adanya, bukan label palsu", () => {
    const card = HIRAGANA_SMALL.find((c) => c.character === "っ")!;
    const [a] = getKanaAudioActions(card);
    expect(a.text).toBe("っ");
    expect(a.text).not.toMatch(/tsu/i);
  });
});

describe("getKanjiAudioActions", () => {
  it("urutan: ON → KUN → example reading", () => {
    const card: KanjiCard = {
      id: "t1", type: "kanji", character: "学", level: "N5",
      meanings: ["belajar"], onyomi: ["がく"], kunyomi: ["まなぶ"],
      commonReadings: ["がく"],
      examples: [{ word: "学生", reading: "がくせい", meaning: "pelajar" }],
    };
    const actions = getKanjiAudioActions(card);
    expect(actions.map((a) => a.id)).toEqual(["on", "kun", "ex-0"]);
    expect(actions[0].text).toBe("がく");
    expect(actions[1].text).toBe("まなぶ");
    expect(actions[2].text).toBe("がくせい");
  });

  it("beberapa reading digabung dengan jeda natural", () => {
    const card = KANJI_N5.find((c) => c.character === "右")!;
    const actions = getKanjiAudioActions(card);
    const on = actions.find((a) => a.id === "on")!;
    expect(on.text).toBe(card.onyomi.join("、"));
    expect(on.text).not.toContain("・");
  });

  it("contoh dibatasi 3, seperti tampilan kartu", () => {
    const card = KANJI_N1.find((c) => c.character === "添")!;
    const exActions = getKanjiAudioActions(card).filter((a) => a.id.startsWith("ex-"));
    expect(exActions.length).toBeLessThanOrEqual(3);
    expect(exActions[0].text).toBe("そう");
  });

  it("kartu tanpa contoh tidak punya aksi example (tidak crash)", () => {
    const card = KANJI_N1.find((c) => c.examples.length === 0)!;
    const actions = getKanjiAudioActions(card);
    expect(actions.some((a) => a.id.startsWith("ex-"))).toBe(false);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("tidak ada arti Indonesia yang diucapkan", () => {
    const card = KANJI_N5.find((c) => c.character === "右")!;
    const texts = getKanjiAudioActions(card).map((a) => a.text).join(" ");
    for (const m of card.meanings) {
      expect(texts).not.toContain(m);
    }
  });
});

describe("tipe kartu", () => {
  it("KanaCard memiliki character", () => {
    const c: KanaCard = HIRAGANA_BASIC[0];
    expect(typeof c.character).toBe("string");
  });
});
