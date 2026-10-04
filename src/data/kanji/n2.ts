/**
 * Dataset Kanji N2 Study Set (543 kanji — new set, TANPA overlap N5/N4/N3).
 *
 * CATATAN PENTING: ini BUKAN "official JLPT N2 kanji list".
 * JLPT tidak mempublikasikan daftar resmi kanji per level.
 * Ini adalah study set yang disusun untuk pembelajar; lihat docs/KANJI-SOURCES.md
 * untuk sumber data dan lisensi, dan docs/KANJI-LEVELS.md untuk definisi level.
 *
 * Dibuat otomatis dari KANJIDIC2 + data contoh; jangan edit manual.
 *
 * File data dipecah menjadi n2a.ts + n2b.ts (batas ukuran file tooling deploy);
 * KANJI_N2 digabung di sini — urutan dan card ID identik dengan sebelumnya.
 */
import type { KanjiCard } from "./types.js";
import { KANJI_N2_A } from "./n2a.js";
import { KANJI_N2_B } from "./n2b.js";

export const KANJI_N2: KanjiCard[] = [...KANJI_N2_A, ...KANJI_N2_B];
