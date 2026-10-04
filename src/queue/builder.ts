/**
 * Smart Study Queue (Phase 12).
 *
 * Prioritas: Learning due → Review due (most overdue first) → New (daily limit).
 * - SRS engine TIDAK diubah; queue hanya memakai state/dueAt dari scheduler.
 * - Ordering deterministic: dueAt → cardId. New mengikuti urutan dataset.
 * - Queue dihitung saat sesi dimulai (bukan setiap render).
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";
import type { CardProgress } from "../srs/types.js";
import { isDue } from "../srs/types.js";
import type { CardMeta } from "../storage/cardMeta.js";
import type { StudyMode } from "../study/modes.js";
import { buildSessionCard } from "../study/modes.js";
import { classifySource } from "./classify.js";
import type {
  CardSource,
  DailyCounts,
  QueueCard,
  QueueLimits,
  QueueResult,
} from "./types.js";

interface Scored {
  card: KanaCard | KanjiCard;
  source: CardSource;
  dueAtMs: number;
}

function byDueThenId(a: Scored, b: Scored): number {
  if (a.dueAtMs !== b.dueAtMs) return a.dueAtMs - b.dueAtMs;
  return a.card.id < b.card.id ? -1 : a.card.id > b.card.id ? 1 : 0;
}

export function buildQueue(args: {
  /** Kandidat dalam urutan dataset (deterministic untuk NEW). */
  cards: Array<KanaCard | KanjiCard>;
  progress: Record<string, CardProgress>;
  mode: StudyMode;
  /** Jumlah kartu yang diminta user (10/20/30/50). */
  requested: number;
  limits: QueueLimits;
  daily: DailyCounts;
  /** Metadata personal (Phase 16). Suspended selalu dikecualikan. */
  cardMeta?: Record<string, CardMeta>;
  /** Jika true: hanya kartu favorite yang masuk queue. */
  favoriteOnly?: boolean;
  now?: Date;
}): QueueResult {
  const { cards, progress, mode, requested, limits, daily } = args;
  const now = args.now ?? new Date();
  const cardMeta = args.cardMeta ?? {};
  const favoriteOnly = args.favoriteOnly ?? false;

  const learningDue: Scored[] = [];
  const reviewDue: Scored[] = [];
  const fresh: Array<KanaCard | KanjiCard> = [];
  let nextReviewAt: string | null = null;
  let nextReviewMs = Infinity;

  for (const card of cards) {
    const meta = cardMeta[card.id];
    // Suspended: dikecualikan dari SEMUA queue. Progress SRS tidak disentuh.
    if (meta?.suspended) continue;
    // Favorite study: hanya kartu favorite.
    if (favoriteOnly && !meta?.favorite) continue;
    const p = progress[card.id];
    const source = classifySource(p ?? null);
    if (source === "new") {
      fresh.push(card);
      continue;
    }
    const dueAtMs = new Date(p.dueAt).getTime();
    if (isDue(p, now)) {
      (source === "learning" ? learningDue : reviewDue).push({ card, source, dueAtMs });
    } else if (dueAtMs < nextReviewMs) {
      nextReviewMs = dueAtMs;
      nextReviewAt = p.dueAt;
    }
  }

  learningDue.sort(byDueThenId);
  reviewDue.sort(byDueThenId);

  const newRemaining = Math.max(0, limits.dailyNew - daily.newCards);
  const reviewRemaining =
    limits.dailyReview <= 0 ? Infinity : Math.max(0, limits.dailyReview - daily.reviewCards);

  const picked: QueueCard[] = [];
  const take = (list: Scored[], n: number) => {
    for (const s of list) {
      if (picked.length >= requested) break;
      if (n <= 0) break;
      const sc = buildSessionCard(s.card, mode);
      picked.push({ card: s.card, source: s.source, prompt: sc.prompt });
      n--;
    }
  };

  // Priority 1: Learning due (tidak kena review limit)
  take(learningDue, requested - picked.length);
  // Priority 2: Review due (kena daily review limit)
  take(reviewDue, Math.min(reviewRemaining, requested - picked.length));
  // Priority 3: New (urutan dataset, kena daily new limit)
  const newToTake = Math.min(newRemaining, requested - picked.length, fresh.length);
  for (let i = 0; i < newToTake; i++) {
    const sc = buildSessionCard(fresh[i], mode);
    picked.push({ card: fresh[i], source: "new", prompt: sc.prompt });
  }

  return {
    cards: picked,
    counts: {
      learningDue: learningDue.length,
      reviewDue: reviewDue.length,
      newAvailable: fresh.length,
      newRemaining,
    },
    nextReviewAt,
  };
}

/** Label human-friendly untuk next review (empty state). */
export function formatNextReview(nextReviewAt: string, now: Date = new Date()): string {
  const diffMs = new Date(nextReviewAt).getTime() - now.getTime();
  if (diffMs <= 0) return "sekarang";
  const hours = diffMs / 3_600_000;
  if (hours < 1) {
    const mins = Math.max(1, Math.round(diffMs / 60_000));
    return `${mins} menit lagi`;
  }
  if (hours < 24) {
    return `${Math.round(hours)} jam lagi`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sameDay =
    new Date(nextReviewAt).toDateString() === tomorrow.toDateString();
  return sameDay ? "Besok" : new Date(nextReviewAt).toLocaleDateString("id-ID");
}

/**
 * Ringkasan "apa yang harus dilakukan hari ini" lintas semua kartu.
 * Satu pass tanpa sorting — aman dipanggil saat render.
 */
export function getTodaySummary(args: {
  cards: Array<KanaCard | KanjiCard>;
  progress: Record<string, CardProgress>;
  limits: QueueLimits;
  daily: DailyCounts;
  now?: Date;
}): {
  learningDue: number;
  reviewDue: number;
  newAvailable: number;
  nextReviewAt: string | null;
} {
  const { cards, progress, limits, daily } = args;
  const now = args.now ?? new Date();
  let learningDue = 0;
  let reviewDue = 0;
  let newAvailable = 0;
  let nextReviewAt: string | null = null;
  let nextReviewMs = Infinity;

  for (const card of cards) {
    const p = progress[card.id];
    const source = classifySource(p ?? null);
    if (source === "new") {
      newAvailable++;
      continue;
    }
    if (isDue(p, now)) {
      if (source === "learning") learningDue++;
      else reviewDue++;
    } else {
      const ms = new Date(p.dueAt).getTime();
      if (ms < nextReviewMs) {
        nextReviewMs = ms;
        nextReviewAt = p.dueAt;
      }
    }
  }

  const newRemaining = Math.max(0, limits.dailyNew - daily.newCards);
  return {
    learningDue,
    reviewDue,
    newAvailable: Math.min(newAvailable, newRemaining),
    nextReviewAt,
  };
}
