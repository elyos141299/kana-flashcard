/**
 * Akses dataset Vocabulary. UI memakai selectVocab() — jangan hard-code list di component.
 */
import type { VocabCard, VocabLevel } from "./types.js";
import { VOCAB_N5 } from "./n5.js";

export * from "./types.js";
export { VOCAB_N5 } from "./n5.js";

const BY_LEVEL: Record<VocabLevel, VocabCard[]> = {
  N5: VOCAB_N5,
};

/** Ambil kartu vocabulary berdasarkan level, urutan deterministic sesuai dataset. */
export function selectVocab(level: VocabLevel): VocabCard[] {
  return [...BY_LEVEL[level]];
}

/** Jumlah kartu vocabulary per level (untuk UI Progress). */
export function countVocab(level: VocabLevel): number {
  return BY_LEVEL[level].length;
}
