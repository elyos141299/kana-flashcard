/**
 * Akses dataset Kanji. UI memakai selectKanji() — jangan hard-code list di component.
 */
import type { KanjiCard, KanjiLevel } from "./types.js";
import { KANJI_N5 } from "./n5.js";
import { KANJI_N4 } from "./n4.js";
import { KANJI_N3 } from "./n3.js";
import { KANJI_N2 } from "./n2.js";
import { KANJI_N1 } from "./n1.js";

export * from "./types.js";
export { KANJI_N5 } from "./n5.js";
export { KANJI_N4 } from "./n4.js";
export { KANJI_N3 } from "./n3.js";
export { KANJI_N2 } from "./n2.js";
export { KANJI_N1 } from "./n1.js";

const BY_LEVEL: Record<KanjiLevel, KanjiCard[]> = {
  N5: KANJI_N5,
  N4: KANJI_N4,
  N3: KANJI_N3,
  N2: KANJI_N2,
  N1: KANJI_N1,
};

/**
 * Ambil kartu kanji berdasarkan level, urutan deterministic sesuai dataset.
 */
export function selectKanji(level: KanjiLevel): KanjiCard[] {
  return [...BY_LEVEL[level]];
}

/** Jumlah kartu kanji per level (untuk UI Progress — dihitung dari dataset). */
export function countKanji(level: KanjiLevel): number {
  return BY_LEVEL[level].length;
}
