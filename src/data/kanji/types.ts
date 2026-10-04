/** Model data Kanji (Phase 3). Terpisah dari progress user. */

export type KanjiLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface KanjiExample {
  word: string;
  reading: string;
  meaning: string;
}

export interface KanjiCard {
  id: string;
  type: "kanji";
  character: string;
  level: KanjiLevel;
  /** Arti Bahasa Indonesia, ringkas. Maks 3. */
  meanings: string[];
  /** Bacaan ON (disimpan hiragana, ditampilkan dengan label ON). */
  onyomi: string[];
  /** Bacaan KUN (hiragana). */
  kunyomi: string[];
  /**
   * Bacaan utama yang paling sering ditemui (bacaan pertama ON + pertama KUN).
   * Untuk referensi cepat; bukan pengganti daftar lengkap.
   */
  commonReadings: string[];
  /** Contoh kosakata beginner. Maks 3. */
  examples: KanjiExample[];
}

export const KANJI_LEVELS: KanjiLevel[] = ["N5", "N4", "N3", "N2", "N1"];
