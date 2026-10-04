/**
 * Card Browser — pure logic (Phase 17).
 *
 * BUKAN dictionary: hanya mencari & memfilter kartu yang sudah ada di dataset.
 * - search: character / reading / romaji (case-insensitive latin, trim, NFC)
 * - filter: dataset, script/level, status (reuse classifySource — tanpa logika duplikat)
 * - eligibility Study This Card: due/new → session, non-due → preview,
 *   suspended → unsuspend dulu, limit habis → blocked.
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";
import type { CardProgress } from "../srs/types.js";
import { isDue } from "../srs/types.js";
import { classifySource } from "../queue/classify.js";
import type { CardMeta } from "../storage/cardMeta.js";
import type { DailyCounts } from "../queue/types.js";

export type AnyCard = KanaCard | KanjiCard;

export type DatasetFilter = "all" | "kana" | "kanji";
export type KanaScriptFilter = "hiragana" | "katakana";
export type StatusFilter =
  | "all"
  | "favorite"
  | "suspended"
  | "due"
  | "new"
  | "learning"
  | "review";

export interface BrowserFilters {
  dataset: DatasetFilter;
  script: KanaScriptFilter; // hanya relevan jika dataset kana/all
  level: string; // "N5".."N1" atau "all"
  status: StatusFilter;
}

export const DEFAULT_FILTERS: BrowserFilters = {
  dataset: "all",
  script: "hiragana",
  level: "all",
  status: "all",
};

/** Normalisasi query: trim + NFC. */
export function normalizeQuery(q: string): string {
  return q.normalize("NFC").trim();
}

/** Apakah kartu cocok dengan query (character / reading / romaji). */
export function matchesCard(card: AnyCard, rawQuery: string): boolean {
  const query = normalizeQuery(rawQuery);
  if (!query) return true;
  const qLower = query.toLowerCase();
  if (card.character.includes(query)) return true;
  if (card.type === "kana") {
    return !!card.romaji && card.romaji.toLowerCase().includes(qLower);
  }
  const readings = [...card.commonReadings, ...card.onyomi, ...card.kunyomi];
  return readings.some((r) => r.includes(query));
}

export function searchCards(cards: AnyCard[], rawQuery: string): AnyCard[] {
  const query = normalizeQuery(rawQuery);
  if (!query) return cards;
  return cards.filter((c) => matchesCard(c, query));
}

function statusMatches(
  card: AnyCard,
  status: StatusFilter,
  progress: Record<string, CardProgress>,
  meta: Record<string, CardMeta>,
  now: Date,
): boolean {
  const m = meta[card.id];
  const p = progress[card.id] ?? null;
  switch (status) {
    case "all":
      return true;
    case "favorite":
      return !!m?.favorite;
    case "suspended":
      return !!m?.suspended;
    case "due":
      return !!p && isDue(p, now);
    case "new":
      return classifySource(p) === "new";
    case "learning":
      return classifySource(p) === "learning";
    case "review":
      return classifySource(p) === "review";
  }
}

/** Filter dataset + status. Urutan dataset dipertahankan (default sort). */
export function filterCards(
  cards: AnyCard[],
  filters: BrowserFilters,
  progress: Record<string, CardProgress>,
  meta: Record<string, CardMeta>,
  now: Date = new Date(),
): AnyCard[] {
  return cards.filter((card) => {
    if (filters.dataset === "kana" && card.type !== "kana") return false;
    if (filters.dataset === "kanji" && card.type !== "kanji") return false;
    if (filters.dataset === "kana" && card.type === "kana" && card.script !== filters.script) {
      return false;
    }
    if (filters.dataset === "kanji" && filters.level !== "all" && card.type === "kanji") {
      if (card.level !== filters.level) return false;
    }
    return statusMatches(card, filters.status, progress, meta, now);
  });
}

export type StudyEligibility =
  | { kind: "session" }
  | { kind: "preview" }
  | { kind: "blocked-suspended" }
  | { kind: "blocked-limit"; reason: "new" | "review" };

/**
 * Aturan Study This Card:
 * - suspended → unsuspend dulu
 * - new → session jika daily new limit tersisa
 * - learning/review due → session (learning bypass review limit, spt queue)
 * - review due tapi review limit habis → blocked
 * - belum due → preview only (bukan bypass SRS)
 */
export function studyEligibility(
  card: AnyCard,
  progress: Record<string, CardProgress>,
  meta: Record<string, CardMeta>,
  daily: DailyCounts,
  limits: { dailyNew: number; dailyReview: number },
  now: Date = new Date(),
): StudyEligibility {
  if (meta[card.id]?.suspended) return { kind: "blocked-suspended" };
  const p = progress[card.id] ?? null;
  const source = classifySource(p);
  if (source === "new") {
    if (daily.newCards >= limits.dailyNew) return { kind: "blocked-limit", reason: "new" };
    return { kind: "session" };
  }
  if (!p || !isDue(p, now)) return { kind: "preview" };
  if (source === "review" && limits.dailyReview > 0 && daily.reviewCards >= limits.dailyReview) {
    return { kind: "blocked-limit", reason: "review" };
  }
  return { kind: "session" };
}
