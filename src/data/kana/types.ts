/** Model data Kana (Phase 2). Terpisah dari progress user. */

export type KanaScript = "hiragana" | "katakana";
export type KanaGroup = "basic" | "dakuten" | "handakuten" | "combination" | "small";

export interface KanaCard {
  id: string;
  type: "kana";
  script: KanaScript;
  group: KanaGroup;
  character: string;
  /** Bacaan Hepburn. Kosong hanya untuk っ/ッ (lihat note). */
  romaji: string;
  /** Penjelasan khusus (dipakai untuk っ/ッ). */
  note?: string;
  example?: string;
  exampleReading?: string;
  exampleMeaning?: string;
}

export const KANA_GROUPS: KanaGroup[] = ["basic", "dakuten", "handakuten", "combination", "small"];

export const GROUP_LABELS: Record<KanaGroup, string> = {
  basic: "Basic",
  dakuten: "Dakuten",
  handakuten: "Handakuten",
  combination: "Combination",
  small: "Small Kana",
};

export const GROUP_SIZES: Record<KanaGroup, number> = {
  basic: 46,
  dakuten: 20,
  handakuten: 5,
  combination: 33,
  small: 9,
};
