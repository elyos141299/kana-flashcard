/**
 * Typing Recall — answer checking (Phase 15).
 *
 * Pure functions: normalization aman + exact matching.
 * Tidak ada fuzzy matching agresif — karakter yang berbeda tetap salah.
 */

export interface TypingCheckResult {
  /** Jawaban user setelah normalization. */
  userAnswer: string;
  /** Jawaban yang diharapkan setelah normalization. */
  expectedAnswer: string;
  correct: boolean;
}

/**
 * Normalisasi aman:
 * - trim leading/trailing whitespace
 * - Unicode NFC (mis. か + ゙ → が)
 */
export function normalizeTypingAnswer(input: string): string {
  return input.normalize("NFC").trim();
}

/**
 * Cek jawaban typing.
 *
 * @param input jawaban mentah user
 * @param expectedAnswer karakter Jepang yang diharapkan
 * @param altRomaji romaji alternatif (HANYA untuk kana; jangan isi untuk kanji)
 *
 * Kana: terima karakter kana ATAU romaji (case-insensitive) sebagai alternatif.
 * Kanji: hanya karakter kanji yang benar yang diterima — reading tidak boleh.
 */
export function checkTypingAnswer(
  input: string,
  expectedAnswer: string,
  altRomaji?: string,
): TypingCheckResult {
  const userAnswer = normalizeTypingAnswer(input);
  const expected = normalizeTypingAnswer(expectedAnswer);
  let correct = userAnswer.length > 0 && userAnswer === expected;
  if (!correct && altRomaji) {
    const alt = altRomaji.normalize("NFC").trim();
    if (alt.length > 0 && userAnswer.toUpperCase() === alt.toUpperCase()) {
      correct = true;
    }
  }
  return { userAnswer, expectedAnswer: expected, correct };
}
