/**
 * PART C — Vocabulary Typing Recall Tests.
 *
 * Test: correct, incorrect, empty, whitespace, answer matching rules.
 */
import { describe, it, expect } from "vitest";
import { VOCAB_N5 } from "../index.js";
import { checkTypingAnswer, normalizeTypingAnswer } from "../../../study/typing.js";
import { buildSessionCard } from "../../../study/modes.js";

const TYPING_WORDS = [
  "食べる", "何", "良い", "誰", "時間", "高い", "ある", "いる",
  "勉強", "ごめん", "バス停",
];

function getExpected(card: (typeof VOCAB_N5)[number]): string {
  const sc = buildSessionCard(card, "typing-recall");
  return sc.expectedAnswer!;
}

describe("PART C — Vocabulary Typing Recall", () => {
  describe("expected answer", () => {
    it("semua test words ada di dataset", () => {
      for (const w of TYPING_WORDS) {
        expect(VOCAB_N5.find((c) => c.word === w), w).toBeDefined();
      }
    });
    it("expected answer = word (strict)", () => {
      for (const w of TYPING_WORDS) {
        const card = VOCAB_N5.find((c) => c.word === w)!;
        expect(getExpected(card)).toBe(w);
      }
    });
    it("良い: expected = 良い (bukan いい/よい)", () => {
      const card = VOCAB_N5.find((c) => c.word === "良い")!;
      expect(getExpected(card)).toBe("良い");
    });
    it("何: expected = 何 (satu lexical entry)", () => {
      const card = VOCAB_N5.find((c) => c.word === "何")!;
      expect(getExpected(card)).toBe("何");
    });
  });

  describe("answer matching", () => {
    it("correct: exact match", () => {
      const r = checkTypingAnswer("食べる", "食べる");
      expect(r.correct).toBe(true);
    });
    it("incorrect: wrong answer", () => {
      const r = checkTypingAnswer("飲む", "食べる");
      expect(r.correct).toBe(false);
    });
    it("empty: tidak correct", () => {
      const r = checkTypingAnswer("", "食べる");
      expect(r.correct).toBe(false);
    });
    it("whitespace: di-trim", () => {
      const r = checkTypingAnswer("  食べる  ", "食べる");
      expect(r.correct).toBe(true);
      expect(r.userAnswer).toBe("食べる");
    });
    it("reading tidak diterima sebagai jawaban (strict)", () => {
      // User harus mengetik 食べる, bukan たべる
      const r = checkTypingAnswer("たべる", "食べる");
      expect(r.correct).toBe(false);
    });
    it("NFC normalization", () => {
      const input = "が".normalize("NFD");
      const r = checkTypingAnswer(input, "が");
      expect(r.correct).toBe(true);
    });
  });

  describe("multiple meaning prompt", () => {
    it("時間 prompt = meaning pertama", () => {
      const card = VOCAB_N5.find((c) => c.word === "時間")!;
      const sc = buildSessionCard(card, "typing-recall");
      expect(sc.prompt).toBe(card.meanings[0]);
    });
    it("tidak duplicate card untuk multiple meanings", () => {
      expect(VOCAB_N5.filter((c) => c.word === "時間").length).toBe(1);
      expect(VOCAB_N5.filter((c) => c.word === "高い").length).toBe(1);
    });
  });

  describe("normalizeTypingAnswer", () => {
    it("trim + NFC", () => {
      expect(normalizeTypingAnswer("  たべる  ")).toBe("たべる");
    });
  });
});
