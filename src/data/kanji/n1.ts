/**
 * Dataset Kanji 1 Study Set.
 *
 * File data dipecah menjadi n1a.ts + n1b.ts (batas ukuran file tooling deploy);
 * KANJI_N1 digabung di sini — urutan dan card ID identik dengan sebelumnya.
 */
import type { KanjiCard } from "./types.js";
import { KANJI_N1_A } from "./n1a";
import { KANJI_N1_B } from "./n1b";

export const KANJI_N1: KanjiCard[] = [...KANJI_N1_A, ...KANJI_N1_B];
