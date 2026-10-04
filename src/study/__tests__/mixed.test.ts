/**
 * Mixed Study (Phase 18): pool composition, dedup, queue behavior.
 * SRS tidak berubah — mixed hanya menentukan candidate pool.
 */
import { describe, it, expect } from "vitest";
import {
  buildMixedPool,
  MIXED_SET_ORDER,
  MIXED_SET_SIZES,
  type MixedSetId,
} from "../mixed.js";
import { buildQueue } from "../../queue/builder.js";
import { buildSessionCard } from "../modes.js";
import { rateCard } from "../../srs/scheduler.js";
import type { CardProgress } from "../../srs/types.js";

const limits = { dailyNew: 20, dailyReview: 100 };
const emptyDaily = { newCards: 0, reviewCards: 0, learningCards: 0 };
const NOW = new Date("2026-10-04T12:00:00");
const past = "2026-10-01T00:00:00.000Z";
const future = "2026-10-10T00:00:00.000Z";

function prog(cardId: string, state: "learning" | "review", dueAt: string): CardProgress {
  return {
    cardId, state, interval: state === "review" ? 4 : 0, ease: 2.5, dueAt,
    learningStep: 0, reviewCount: 1, lapses: 0, lastReviewedAt: null,
    createdAt: "2026-09-01T00:00:00.000Z", previousInterval: null,
  };
}

describe("buildMixedPool", () => {
  it("hiragana only = 113", () => {
    expect(buildMixedPool(["hiragana"]).length).toBe(113);
  });
  it("katakana only = 113", () => {
    expect(buildMixedPool(["katakana"]).length).toBe(113);
  });
  it("N5 only = 114", () => {
    expect(buildMixedPool(["N5"]).length).toBe(114);
  });
  it("N5 + N4 = 282", () => {
    expect(buildMixedPool(["N5", "N4"]).length).toBe(114 + 168);
  });
  it("hiragana + katakana = 226", () => {
    expect(buildMixedPool(["hiragana", "katakana"]).length).toBe(226);
  });
  it("hiragana + N5 = 227", () => {
    expect(buildMixedPool(["hiragana", "N5"]).length).toBe(227);
  });
  it("all seven sets = 1950", () => {
    const pool = buildMixedPool([...MIXED_SET_ORDER]);
    expect(pool.length).toBe(226 + 1724);
  });
  it("urutan mengikuti MIXED_SET_ORDER walau input acak", () => {
    const a = buildMixedPool(["N5", "hiragana"]);
    const b = buildMixedPool(["hiragana", "N5"]);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    // hiragana dulu, baru N5
    expect(a[0].id.startsWith("hiragana")).toBe(true);
    expect(a[113].id.startsWith("kanji")).toBe(true);
  });
  it("deduplicate by cardId: tidak ada id ganda", () => {
    const pool = buildMixedPool(["N5", "N5", "hiragana"]);
    const ids = pool.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pool.length).toBe(114 + 113);
  });
  it("MIXED_SET_SIZES konsisten dengan pool", () => {
    for (const id of MIXED_SET_ORDER) {
      expect(buildMixedPool([id]).length).toBe(MIXED_SET_SIZES[id as MixedSetId]);
    }
  });
});

describe("mixed queue", () => {
  it("priority: learning due → review due → new (global, tanpa priority level)", () => {
    const pool = buildMixedPool(["hiragana", "N5"]);
    const hira = pool.find((c) => c.id.startsWith("hiragana"))!;
    const kanji = pool.find((c) => c.id.startsWith("kanji"))!;
    const hira2 = pool.filter((c) => c.id.startsWith("hiragana"))[1];
    const progress = {
      [hira.id]: prog(hira.id, "review", past),
      [kanji.id]: prog(kanji.id, "learning", past),
    };
    const result = buildQueue({
      cards: pool, progress, mode: "recognition", requested: 50,
      limits, daily: emptyDaily, now: NOW,
    });
    const ids = result.cards.map((c) => c.card.id);
    // learning (kanji) paling dulu, lalu review (hira), lalu new (hira2)
    expect(ids[0]).toBe(kanji.id);
    expect(ids[1]).toBe(hira.id);
    expect(ids).toContain(hira2.id);
  });

  it("review order: most overdue first lintas dataset", () => {
    const pool = buildMixedPool(["N5", "N4"]);
    const n5 = pool.find((c) => c.id.includes("n5"))!;
    const n4 = pool.find((c) => c.id.includes("n4"))!;
    const progress = {
      [n5.id]: prog(n5.id, "review", "2026-10-01T00:00:00.000Z"), // overdue 3 hari
      [n4.id]: prog(n4.id, "review", "2026-10-03T00:00:00.000Z"), // overdue 1 hari
    };
    const result = buildQueue({
      cards: pool, progress, mode: "recognition", requested: 50,
      limits, daily: emptyDaily, now: NOW,
    });
    expect(result.cards.map((c) => c.card.id).slice(0, 2)).toEqual([n5.id, n4.id]);
  });

  it("daily new limit global untuk mixed pool", () => {
    const pool = buildMixedPool(["hiragana", "N5"]);
    const result = buildQueue({
      cards: pool, progress: {}, mode: "recognition", requested: 50,
      limits: { dailyNew: 5, dailyReview: 100 }, daily: emptyDaily, now: NOW,
    });
    expect(result.cards.length).toBe(5);
  });

  it("suspended selected card excluded", () => {
    const pool = buildMixedPool(["hiragana"]);
    const first = pool[0];
    const result = buildQueue({
      cards: pool, progress: {}, mode: "recognition", requested: 50,
      limits, daily: emptyDaily,
      cardMeta: { [first.id]: { favorite: false, suspended: true } },
      now: NOW,
    });
    expect(result.cards.some((c) => c.card.id === first.id)).toBe(false);
  });

  it("favorite tidak mendapat priority khusus", () => {
    const pool = buildMixedPool(["hiragana"]);
    const due = pool[0];
    const fav = pool[1];
    const progress = { [due.id]: prog(due.id, "review", past) };
    const result = buildQueue({
      cards: pool, progress, mode: "recognition", requested: 50,
      limits, daily: emptyDaily,
      cardMeta: { [fav.id]: { favorite: true, suspended: false } },
      now: NOW,
    });
    // review due tetap di depan favorite new
    expect(result.cards[0].card.id).toBe(due.id);
  });

  it("favoriteOnly + mixed: hanya favorite eligible", () => {
    const pool = buildMixedPool(["hiragana", "N5"]);
    const favDue = pool[0];
    const favNew = pool[1];
    const progress = { [favDue.id]: prog(favDue.id, "review", past) };
    const meta = {
      [favDue.id]: { favorite: true, suspended: false },
      [favNew.id]: { favorite: true, suspended: false },
    };
    const result = buildQueue({
      cards: pool, progress, mode: "recognition", requested: 50,
      limits, daily: emptyDaily, cardMeta: meta, favoriteOnly: true, now: NOW,
    });
    const ids = result.cards.map((c) => c.card.id);
    expect(ids).toContain(favDue.id);
    expect(ids).toContain(favNew.id);
    expect(result.cards.length).toBe(2);
  });

  it("non-due tetap excluded dari mixed", () => {
    const pool = buildMixedPool(["N5"]);
    const card = pool[0];
    const progress = { [card.id]: prog(card.id, "review", future) };
    const result = buildQueue({
      cards: [card], progress, mode: "recognition", requested: 10,
      limits, daily: emptyDaily, now: NOW,
    });
    expect(result.cards.length).toBe(0);
  });

  it("deterministic: input sama → urutan sama", () => {
    const mk = () =>
      buildQueue({
        cards: buildMixedPool(["hiragana", "katakana", "N5"]),
        progress: {}, mode: "recall", requested: 30,
        limits, daily: emptyDaily, now: NOW,
      }).cards.map((c) => c.card.id);
    expect(mk()).toEqual(mk());
  });
});

describe("mixed session", () => {
  it("mode session-wide: semua kartu pakai mode yang sama", () => {
    const pool = buildMixedPool(["hiragana", "N5"]).slice(0, 5);
    for (const card of pool) {
      const sc = buildSessionCard(card, "typing-recall");
      expect(sc.mode).toBe("typing-recall");
      expect(sc.expectedAnswer).toBe(card.character);
    }
  });

  it("same cardId tetap same progress setelah rating", () => {
    const pool = buildMixedPool(["N5"]);
    const card = pool[0];
    const next = rateCard(null, card.id, "good");
    expect(next.cardId).toBe(card.id);
    expect(next.state).toBe("learning");
  });
});
