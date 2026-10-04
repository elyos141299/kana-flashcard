/**
 * Dataset Kanji 3 Study Set.
 *
 * File data dipecah menjadi n3a.ts + n3b.ts (batas ukuran file tooling deploy);
 * KANJI_N3 digabung di sini — urutan dan card ID identik dengan sebelumnya.
 */
import type { KanjiCard } from "./types.js";
import { KANJI_N3_A } from "./n3a";
import { KANJI_N3_B } from "./n3b";

export const KANJI_N3: KanjiCard[] = [...KANJI_N3_A, ...KANJI_N3_B];
