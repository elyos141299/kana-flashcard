/**
 * Test Study Modes (Phase 11): Recognition vs Recall.
 * Kunci: satu cardId = satu progress SRS, apa pun modenya.
 */
import { describe, it, expect } from "vitest";
import {
  getKanaRecallPrompt,
  getKanjiRecallPrompt,
  buildSessionCard,
} from "../modes.js";
import { rateCard } from "../../srs/scheduler.js";
import {
  HIRAGANA_BASIC,
  HIRAGANA_SMALL,
  HIRAGANA_COMBINATION,
} from "../../data/kana/hiragana.js";
import { KATAKANA_BASIC } from "../../data/kana/katakana.js";
import { KANJI_N5 } from "../../data/kanji/n5.js";
import { KANJI_N4 } from "../../data/kanji/n4.js";
import { KANJI_N3 } from "../../data/kanji/n3.js";
import { KANJI_N2 } from "../../data/kanji/n2.js";
import { KANJI_N1 } from "../../data/kanji/n1.js";
import type { KanjiCard } from "../../data/kanji/index.js";

const ALL_KANJI: KanjiCard[] = [...KANJI_N5, ...KANJI_N4, ...KANJI_N3, ...KANJI_N2, ...KANJI_N1];

describe("kana recall prompt", () => {
  it("hiragana ね → NE", () => {
    const card = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    expect(getKanaRecallPrompt(card)).toBe("NE");
  });

  it("katakana シ → SHI", () => {
    const card = KATAKANA_BASIC.find((c) => c.character === "シ")!;
    expect(getKanaRecallPrompt(card)).toBe("SHI");
  });

  it("combination きゃ → KYA", () => {
    const card = HIRAGANA_COMBINATION.find((c) => c.character === "きゃ")!;
    expect(getKanaRecallPrompt(card)).toBe("KYA");
  });

  it("small kana っ → SMALL TSU (wording jelas, bukan romaji kosong)", () => {
    const card = HIRAGANA_SMALL.find((c) => c.character === "っ")!;
    expect(getKanaRecallPrompt(card)).toBe("SMALL TSU");
  });

  it("small kana ぁ → A", () => {
    const card = HIRAGANA_SMALL.find((c) => c.character === "ぁ")!;
    expect(getKanaRecallPrompt(card)).toBe("A");
  });
});

describe("kanji recall prompt", () => {
  it("prioritas: common reading → ON → KUN", () => {
    const card: KanjiCard = {
      id: "t", type: "kanji", character: "学", level: "N5",
      meanings: ["belajar"], onyomi: ["がく"], kunyomi: ["まなぶ"],
      commonReadings: ["がく"], examples: [],
    };
    expect(getKanjiRecallPrompt(card)).toBe("がく");

    const noCommon: KanjiCard = { ...card, commonReadings: [] };
    expect(getKanjiRecallPrompt(noCommon)).toBe("がく"); // ON pertama

    const kunOnly: KanjiCard = { ...card, commonReadings: [], onyomi: [] };
    expect(getKanjiRecallPrompt(kunOnly)).toBe("まなぶ"); // KUN pertama
  });

  it("deterministic: kartu sama → prompt sama", () => {
    const card = KANJI_N5[0];
    expect(getKanjiRecallPrompt(card)).toBe(getKanjiRecallPrompt(card));
  });

  it("prompt tidak kosong dan bukan karakter jawaban", () => {
    for (const card of ALL_KANJI) {
      const p = getKanjiRecallPrompt(card);
      expect(p.length).toBeGreaterThan(0);
      expect(p).not.toBe(card.character);
    }
  });

  it("prompt berasal dari data kartu (common/ON/KUN)", () => {
    for (const card of ALL_KANJI) {
      const p = getKanjiRecallPrompt(card);
      const valid = [...card.commonReadings, ...card.onyomi, ...card.kunyomi];
      expect(valid).toContain(p);
    }
  });

  it("semua level N5–N1 punya prompt valid", () => {
    expect(ALL_KANJI.length).toBe(1724);
  });
});

describe("buildSessionCard", () => {
  it("recognition → tanpa prompt", () => {
    const sc = buildSessionCard(HIRAGANA_BASIC[0], "recognition");
    expect(sc.mode).toBe("recognition");
    expect(sc.prompt).toBeUndefined();
  });

  it("recall kana → prompt romaji", () => {
    const card = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    const sc = buildSessionCard(card, "recall");
    expect(sc.mode).toBe("recall");
    expect(sc.prompt).toBe("NE");
    expect(sc.card.id).toBe(card.id);
  });

  it("recall kanji → prompt reading", () => {
    const card = KANJI_N5.find((c) => c.character === "日")!;
    const sc = buildSessionCard(card, "recall");
    expect(sc.prompt).toBe(getKanjiRecallPrompt(card));
  });
});

describe("SRS: satu cardId = satu progress untuk kedua mode", () => {
  it("recognition + recall pada kartu sama → satu record", () => {
    const card = KANJI_N5.find((c) => c.character === "日")!;
    const rec = buildSessionCard(card, "recognition");
    const cal = buildSessionCard(card, "recall");
    // Keduanya memakai cardId yang sama
    expect(rec.card.id).toBe(cal.card.id);

    // Simulasi rating dari kedua mode ke store yang sama
    const store: Record<string, ReturnType<typeof rateCard>> = {};
    store[rec.card.id] = rateCard(store[rec.card.id] ?? null, rec.card.id, "good");
    store[cal.card.id] = rateCard(store[cal.card.id] ?? null, cal.card.id, "good");

    expect(Object.keys(store)).toHaveLength(1);
    expect(store[card.id].cardId).toBe(card.id);
  });
});
