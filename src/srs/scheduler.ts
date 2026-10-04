/**
 * Satu pintu masuk penilaian kartu.
 * UI hanya memanggil rateCard — tidak menghitung interval sendiri.
 */
import type { CardProgress, Rating } from "./types.js";
import { rateNewCard, rateLearningCard } from "./learning.js";
import { rateReviewCard } from "./review.js";

/**
 * Nilai sebuah kartu.
 * @param progress progress saat ini, atau null jika kartu masih NEW.
 * @param cardId id kartu (dipakai saat progress null).
 * @param rating again | hard | good | easy
 * @param now waktu acuan (default: sekarang). Parameter ini membuat
 *        scheduler deterministik dan mudah di-unit-test.
 * @returns progress baru (objek baru, tidak mutasi input).
 */
export function rateCard(
  progress: CardProgress | null,
  cardId: string,
  rating: Rating,
  now: Date = new Date(),
): CardProgress {
  if (progress == null) return rateNewCard(cardId, rating, now);
  switch (progress.state) {
    case "new":
      return rateNewCard(cardId, rating, now);
    case "learning":
      return rateLearningCard(progress, rating, now);
    case "review":
      return rateReviewCard(progress, rating, now);
  }
}
