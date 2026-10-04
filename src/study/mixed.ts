/**
 * Mixed Study (Phase 18): gabungan beberapa dataset jadi satu candidate pool.
 *
 * Hanya mengubah SUMBER kartu untuk membangun session queue.
 * - SRS, cardId, progress, limits, favorite/suspend: tidak berubah.
 * - Merge urutan tetap: hiragana → katakana → N5 → N4 → N3 → N2 → N1.
 * - Deduplicate by cardId (bukan character — し dan シ kartu berbeda).
 * - Tidak meng-copy dataset: pool berisi reference kartu yang sama.
 * - Deterministic: input sama → urutan sama.
 */
import type { KanaCard } from "../data/kana/index.js";
import { selectKana } from "../data/kana/index.js";
import type { KanjiCard, KanjiLevel } from "../data/kanji/index.js";
import { selectKanji } from "../data/kanji/index.js";

export type MixedSetId =
  | "hiragana"
  | "katakana"
  | "N5"
  | "N4"
  | "N3"
  | "N2"
  | "N1";

export const MIXED_SET_ORDER: readonly MixedSetId[] = [
  "hiragana",
  "katakana",
  "N5",
  "N4",
  "N3",
  "N2",
  "N1",
] as const;

export const MIXED_SET_LABELS: Record<MixedSetId, string> = {
  hiragana: "Hiragana",
  katakana: "Katakana",
  N5: "Kanji N5",
  N4: "Kanji N4",
  N3: "Kanji N3",
  N2: "Kanji N2",
  N1: "Kanji N1",
};

/** Jumlah kartu per set (untuk label UI). Dihitung sekali dari dataset. */
function setSize(id: MixedSetId): number {
  switch (id) {
    case "hiragana":
      return selectKana("hiragana", "all").length;
    case "katakana":
      return selectKana("katakana", "all").length;
    default:
      return selectKanji(id as KanjiLevel).length;
  }
}

export const MIXED_SET_SIZES: Record<MixedSetId, number> = {
  hiragana: setSize("hiragana"),
  katakana: setSize("katakana"),
  N5: setSize("N5"),
  N4: setSize("N4"),
  N3: setSize("N3"),
  N2: setSize("N2"),
  N1: setSize("N1"),
};

function cardsForSet(id: MixedSetId): Array<KanaCard | KanjiCard> {
  switch (id) {
    case "hiragana":
      return selectKana("hiragana", "all");
    case "katakana":
      return selectKana("katakana", "all");
    default:
      return selectKanji(id as KanjiLevel);
  }
}

/**
 * Bangun merged pool dari set yang dipilih.
 * Urutan: MIXED_SET_ORDER; di dalam set: urutan dataset masing-masing.
 */
export function buildMixedPool(
  selected: Iterable<MixedSetId>,
): Array<KanaCard | KanjiCard> {
  const want = new Set(selected);
  const merged = new Map<string, KanaCard | KanjiCard>();
  for (const id of MIXED_SET_ORDER) {
    if (!want.has(id)) continue;
    for (const card of cardsForSet(id)) {
      if (!merged.has(card.id)) merged.set(card.id, card);
    }
  }
  return [...merged.values()];
}
