/**
 * Study modes (Phase 11): Recognition vs Recall. (Phase 15: + Typing Recall)
 *
 * Satu cardId = satu progress SRS, apa pun modenya. Mode hanya menentukan
 * bagaimana kartu DITAMPILKAN (prompt), bukan identitas kartu.
 * - Recognition: karakter Jepang → reading / meaning (mode lama).
 * - Recall: romaji → kana, atau reading → kanji.
 * - Typing Recall: user mengetik jawaban (karakter Jepang) sebelum reveal.
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";

export type StudyMode = "recognition" | "recall" | "typing-recall";

export type PromptType = "character" | "romaji" | "reading";

export interface SessionCard {
  card: KanaCard | KanjiCard;
  mode: StudyMode;
  /**
   * Teks prompt untuk mode recall / typing-recall (romaji / reading).
   * Disimpan di session card agar reveal konsisten.
   * Undefined untuk recognition.
   */
  prompt?: string;
  /** Jenis prompt; hanya untuk recall & typing-recall. */
  promptType?: PromptType;
  /**
   * Jawaban yang diharapkan untuk typing-recall (karakter Jepang).
   * Transient session data — TIDAK disimpan ke permanent progress storage.
   */
  expectedAnswer?: string;
}

/**
 * Prompt recall untuk kana: romaji uppercase.
 * Small kana tanpa romaji (っ/ッ): wording jelas "SMALL TSU".
 */
export function getKanaRecallPrompt(card: KanaCard): string {
  if (card.group === "small" && !card.romaji) return "SMALL TSU";
  return card.romaji.toUpperCase();
}

/**
 * Prompt recall untuk kanji: SATU reading, deterministic.
 * Prioritas: common reading → ON → KUN. Selalu dari data kartu.
 */
export function getKanjiRecallPrompt(card: KanjiCard): string {
  return card.commonReadings[0] ?? card.onyomi[0] ?? card.kunyomi[0] ?? "";
}

/** Bangun session card: hitung prompt sekali di awal sesi. */
export function buildSessionCard(
  card: KanaCard | KanjiCard,
  mode: StudyMode,
): SessionCard {
  if (mode === "recognition") return { card, mode };
  if (card.type === "kana") {
    const prompt = getKanaRecallPrompt(card);
    if (mode === "typing-recall") {
      return {
        card,
        mode,
        prompt,
        promptType: "romaji",
        expectedAnswer: card.character,
      };
    }
    return { card, mode, prompt, promptType: "romaji" };
  }
  const prompt = getKanjiRecallPrompt(card);
  if (mode === "typing-recall") {
    return {
      card,
      mode,
      prompt,
      promptType: "reading",
      expectedAnswer: card.character,
    };
  }
  return { card, mode, prompt, promptType: "reading" };
}

export const MODE_LABELS: Record<StudyMode, string> = {
  recognition: "Recognition",
  recall: "Recall",
  "typing-recall": "Typing Recall",
};
