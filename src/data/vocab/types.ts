/** Model data Vocabulary (N5). Terpisah dari progress user. */

export type VocabLevel = "N5";

export interface VocabExample {
  sentence: string;
  reading: string;
  meaning: string;
  /** Reading yang dipakai di example (bila beda dari primary). */
  usedReading?: string;
}

export interface VocabCard {
  id: string;
  type: "vocabulary";
  level: VocabLevel;
  /** Bentuk utama (kanji/kana). */
  word: string;
  /** Bentuk kana eksplisit (bila word adalah kanji). */
  kanaForm?: string;
  /** Reading utama untuk pembelajaran. */
  reading: string;
  /** Multiple readings (bila ada). */
  readings?: string[];
  /** Reading yang diprioritaskan. */
  primaryReading?: string;
  /** Arti Bahasa Indonesia. */
  meanings: string[];
  /** Normalized POS codes. */
  pos: string[];
  /** Kategori pembelajaran. */
  learningCategory: string;
  /** Register (mis. "casual"). */
  register?: string;
  /** Contoh kalimat. */
  examples?: VocabExample[];
}

export const VOCAB_LEVELS: VocabLevel[] = ["N5"];
