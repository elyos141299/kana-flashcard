/**
 * Study modes (Phase 11): Recognition vs Recall.
 *
 * Satu cardId = satu progress SRS, apa pun modenya. Mode hanya menentukan
 * bagaimana kartu DITAMPILKAN (prompt), bukan identitas kartu.
 * - Recognition: karakter Jepang → reading / meaning (mode lama).
 * - Recall: romaji → kana, atau reading → kanji.
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";

export type StudyMode = "recognition" | "recall";

export interface SessionCard {
  card: KanaCard | KanjiCard;
  mode: StudyMode;
  /**
   * Teks prompt untuk mode recall (romaji / reading).
   * Disimpan di session card agar reveal konsisten.
   * Undefined untuk recognition.
   */
  prompt?: string;
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
  const prompt =
    card.type === "kana" ? getKanaRecallPrompt(card) : getKanjiRecallPrompt(card);
  return { card, mode, prompt };
}

export const MODE_LABELS: Record<StudyMode, string> = {
  recognition: "Recognition",
  recall: "Recall",
};
