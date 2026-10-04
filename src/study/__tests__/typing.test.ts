/**
 * Typing Recall (Phase 15): normalization + exact matching.
 */
import { describe, it, expect } from "vitest";
import { normalizeTypingAnswer, checkTypingAnswer } from "../typing.js";
import { buildSessionCard } from "../modes.js";
import { HIRAGANA_BASIC, HIRAGANA_SMALL, HIRAGANA_COMBINATION } from "../../data/kana/hiragana.js";
import { KATAKANA_BASIC, KATAKANA_COMBINATION } from "../../data/kana/katakana.js";
import { KANJI_N5 } from "../../data/kanji/n5.js";

describe("normalizeTypingAnswer", () => {
  it("identitas", () => {
    expect(normalizeTypingAnswer("ね")).toBe("ね");
  });
  it("trim whitespace", () => {
    expect(normalizeTypingAnswer(" ね ")).toBe("ね");
  });
  it("Unicode NFC (か + dakuten → が)", () => {
    expect(normalizeTypingAnswer("が")).toBe("が");
  });
});

describe("kana typing", () => {
  const ne = HIRAGANA_BASIC.find((c) => c.character === "ね")!;

  it("NE → ね (exact)", () => {
    expect(checkTypingAnswer("ね", "ね", ne.romaji).correct).toBe(true);
  });
  it("romaji alternatif diterima (ne → ね)", () => {
    expect(checkTypingAnswer("ne", "ね", ne.romaji).correct).toBe(true);
    expect(checkTypingAnswer("NE", "ね", ne.romaji).correct).toBe(true);
  });
  it("NE → ぬ salah (karakter berbeda)", () => {
    expect(checkTypingAnswer("ぬ", "ね", ne.romaji).correct).toBe(false);
  });
  it("input kosong tidak benar", () => {
    expect(checkTypingAnswer("   ", "ね", ne.romaji).correct).toBe(false);
  });
});

describe("combination typing", () => {
  const kya = HIRAGANA_COMBINATION.find((c) => c.character === "きゃ")!;

  it("KYA → きゃ", () => {
    expect(checkTypingAnswer("きゃ", "きゃ", kya.romaji).correct).toBe(true);
  });
  it("romaji alternatif (kya → きゃ)", () => {
    expect(checkTypingAnswer("kya", "きゃ", kya.romaji).correct).toBe(true);
  });
  it("SHU → しゅ; CHO → ちょ", () => {
    const shu = HIRAGANA_COMBINATION.find((c) => c.character === "しゅ")!;
    const cho = HIRAGANA_COMBINATION.find((c) => c.character === "ちょ")!;
    expect(checkTypingAnswer("しゅ", "しゅ", shu.romaji).correct).toBe(true);
    expect(checkTypingAnswer("ちょ", "ちょ", cho.romaji).correct).toBe(true);
    expect(checkTypingAnswer("しゆ", "しゅ", shu.romaji).correct).toBe(false);
  });
});

describe("small kana typing", () => {
  const tsu = HIRAGANA_SMALL.find((c) => c.character === "っ")!;

  it("SMALL TSU → っ", () => {
    expect(checkTypingAnswer("っ", "っ", tsu.romaji).correct).toBe(true);
  });
  it("つ tidak diterima untuk っ", () => {
    expect(checkTypingAnswer("つ", "っ", tsu.romaji).correct).toBe(false);
  });
});

describe("katakana typing", () => {
  const ne = KATAKANA_BASIC.find((c) => c.character === "ネ")!;
  const kya = KATAKANA_COMBINATION.find((c) => c.character === "キャ")!;

  it("NE → ネ", () => {
    expect(checkTypingAnswer("ネ", "ネ", ne.romaji).correct).toBe(true);
  });
  it("KYA → キャ", () => {
    expect(checkTypingAnswer("キャ", "キャ", kya.romaji).correct).toBe(true);
    expect(checkTypingAnswer("kya", "キャ", kya.romaji).correct).toBe(true);
  });
});

describe("kanji typing", () => {
  it("にち → 日", () => {
    expect(checkTypingAnswer("日", "日").correct).toBe(true);
  });
  it("reading tidak diterima sebagai jawaban kanji", () => {
    expect(checkTypingAnswer("にち", "日").correct).toBe(false);
  });
  it("kanji berbeda tidak diterima (日 ≠ 曰)", () => {
    expect(checkTypingAnswer("曰", "日").correct).toBe(false);
  });
});

describe("session card — same cardId semua mode", () => {
  const card = KANJI_N5.find((c) => c.character === "日")!;

  it("recognition / recall / typing-recall memakai cardId yang sama", () => {
    const a = buildSessionCard(card, "recognition");
    const b = buildSessionCard(card, "recall");
    const c = buildSessionCard(card, "typing-recall");
    expect(a.card.id).toBe(b.card.id);
    expect(b.card.id).toBe(c.card.id);
  });

  it("typing-recall: prompt sama dengan recall, expectedAnswer = karakter", () => {
    const recall = buildSessionCard(card, "recall");
    const typing = buildSessionCard(card, "typing-recall");
    expect(typing.prompt).toBe(recall.prompt);
    expect(typing.expectedAnswer).toBe(card.character);
    expect(typing.promptType).toBe("reading");
  });

  it("kana typing: expectedAnswer = karakter kana, promptType romaji", () => {
    const ne = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    const typing = buildSessionCard(ne, "typing-recall");
    expect(typing.expectedAnswer).toBe("ね");
    expect(typing.prompt).toBe("NE");
    expect(typing.promptType).toBe("romaji");
  });
});
