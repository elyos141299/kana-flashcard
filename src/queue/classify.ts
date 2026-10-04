/**
 * Klasifikasi kartu ke NEW / LEARNING / REVIEW dari progress SRS.
 */
import type { CardProgress } from "../srs/types.js";
import type { CardSource } from "./types.js";

export function classifySource(
  progress: CardProgress | null | undefined,
): CardSource {
  if (!progress || progress.state === "new") return "new";
  // state hanya "learning" | "review" — dikembalikan apa adanya
  return progress.state;
}
