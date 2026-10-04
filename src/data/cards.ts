/**
 * Lookup kartu by id di seluruh dataset (Phase 16).
 * Untuk Favorites / Suspended view — tidak mengubah dataset.
 */
import { HIRAGANA_ALL, KATAKANA_ALL } from "./kana/index.js";
import type { KanaCard } from "./kana/index.js";
import {
  KANJI_N5,
  KANJI_N4,
  KANJI_N3,
  KANJI_N2,
  KANJI_N1,
} from "./kanji/index.js";
import type { KanjiCard } from "./kanji/index.js";

export type AnyCard = KanaCard | KanjiCard;

const ALL: AnyCard[] = [
  ...HIRAGANA_ALL,
  ...KATAKANA_ALL,
  ...KANJI_N5,
  ...KANJI_N4,
  ...KANJI_N3,
  ...KANJI_N2,
  ...KANJI_N1,
];

const BY_ID = new Map<string, AnyCard>(ALL.map((c) => [c.id, c]));

export function getCardById(id: string): AnyCard | undefined {
  return BY_ID.get(id);
}

/** Label kecil untuk list: romaji untuk kana, reading+arti untuk kanji. */
export function cardSubLabel(card: AnyCard): string {
  if (card.type === "kana") {
    const script = card.script === "hiragana" ? "Hiragana" : "Katakana";
    return card.romaji ? `${card.romaji.toUpperCase()} · ${script}` : script;
  }
  const reading =
    card.commonReadings[0] ?? card.onyomi[0] ?? card.kunyomi[0] ?? "";
  const meaning = card.meanings[0] ?? "";
  return [reading, meaning].filter(Boolean).join(" · ");
}
