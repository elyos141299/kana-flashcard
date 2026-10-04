/**
 * Unit test Smart Study Queue (Phase 12).
 * SRS engine TIDAK diubah — queue hanya mengatur urutan & pemilihan.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildQueue, formatNextReview, getTodaySummary } from "../builder.js";
import { classifySource } from "../classify.js";
import type { CardProgress, CardState } from "../../srs/types.js";
import { HIRAGANA_BASIC } from "../../data/kana/hiragana.js";
import { recordCardRated, getDailyCounts } from "../../storage/progress.js";

// stub localStorage minimal
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

beforeEach(() => store.clear());

function makeProgress(cardId: string, state: CardState, dueAt: string): CardProgress {
  return {
    cardId, state,
    interval: state === "review" ? 4 : 0,
    ease: 2.5, dueAt, learningStep: 0, reviewCount: 0, lapses: 0,
    lastReviewedAt: null, createdAt: dueAt, previousInterval: null,
  };
}

const NOW = new Date("2026-10-04T12:00:00");
const cards = HIRAGANA_BASIC.slice(0, 10);
const limits = { dailyNew: 20, dailyReview: 100 };
const emptyDaily = { newCards: 0, reviewCards: 0, learningCards: 0 };

function build(args: Partial<Parameters<typeof buildQueue>[0]> = {}) {
  return buildQueue({
    cards, progress: {}, mode: "recognition",
    requested: 20, limits, daily: emptyDaily, now: NOW, ...args,
  });
}

describe("classifySource", () => {
  it("null → new; new → new; learning → learning; review → review", () => {
    expect(classifySource(null)).toBe("new");
    expect(classifySource(undefined)).toBe("new");
    expect(classifySource(makeProgress("a", "new", ""))).toBe("new");
    expect(classifySource(makeProgress("a", "learning", ""))).toBe("learning");
    expect(classifySource(makeProgress("a", "review", ""))).toBe("review");
  });
});

describe("priority", () => {
  it("Learning due > Review due > New", () => {
    const [cNew, cLearn, cReview] = cards;
    const progress = {
      [cLearn.id]: makeProgress(cLearn.id, "learning", "2026-10-04T11:00:00"),
      [cReview.id]: makeProgress(cReview.id, "review", "2026-10-04T11:00:00"),
    };
    const r = build({ cards: [cNew, cLearn, cReview], progress, requested: 3 });
    expect(r.cards.map((c) => c.source)).toEqual(["learning", "review", "new"]);
  });

  it("most overdue first untuk review", () => {
    const [a, b, c] = cards;
    const progress = {
      [a.id]: makeProgress(a.id, "review", "2026-10-04T11:59:00"), // due sekarang
      [b.id]: makeProgress(b.id, "review", "2026-10-03T12:00:00"), // overdue 1 hari
      [c.id]: makeProgress(c.id, "review", "2026-10-01T12:00:00"), // overdue 3 hari
    };
    const r = build({ cards: [a, b, c], progress, requested: 3 });
    expect(r.cards.map((c) => c.card.id)).toEqual([c.id, b.id, a.id]);
  });

  it("learning due diurut paling overdue dulu", () => {
    const [a, b] = cards;
    const progress = {
      [a.id]: makeProgress(a.id, "learning", "2026-10-04T11:00:00"),
      [b.id]: makeProgress(b.id, "learning", "2026-10-04T10:00:00"),
    };
    const r = build({ cards: [a, b], progress, requested: 2 });
    expect(r.cards.map((c) => c.card.id)).toEqual([b.id, a.id]);
  });

  it("tie-break deterministic: dueAt sama → cardId", () => {
    const [a, b] = cards;
    const progress = {
      [b.id]: makeProgress(b.id, "review", "2026-10-04T11:00:00"),
      [a.id]: makeProgress(a.id, "review", "2026-10-04T11:00:00"),
    };
    const r1 = build({ cards: [a, b], progress, requested: 2 });
    const r2 = build({ cards: [b, a], progress, requested: 2 });
    expect(r1.cards.map((c) => c.card.id)).toEqual(r2.cards.map((c) => c.card.id));
  });

  it("new mengikuti urutan dataset (bukan random)", () => {
    const r = build({ requested: 5 });
    expect(r.cards.map((c) => c.card.character)).toEqual(["あ", "い", "う", "え", "お"]);
  });
});

describe("daily limits", () => {
  it("new limit 20/hari di-enforce", () => {
    const r = build({
      daily: { newCards: 20, reviewCards: 0, learningCards: 0 },
      requested: 10,
    });
    expect(r.cards).toHaveLength(0);
    expect(r.counts.newRemaining).toBe(0);
  });

  it("new tersisa = limit - sudah dipakai", () => {
    const r = build({
      cards: HIRAGANA_BASIC.slice(0, 30),
      daily: { newCards: 15, reviewCards: 0, learningCards: 0 },
      requested: 10,
    });
    expect(r.cards.filter((c) => c.source === "new")).toHaveLength(5);
  });

  it("review limit tercapai → learning due tetap muncul", () => {
    const [cLearn, cReview] = cards;
    const progress = {
      [cLearn.id]: makeProgress(cLearn.id, "learning", "2026-10-04T11:00:00"),
      [cReview.id]: makeProgress(cReview.id, "review", "2026-10-04T11:00:00"),
    };
    const r = build({
      cards: [cLearn, cReview],
      progress,
      daily: { newCards: 0, reviewCards: 100, learningCards: 0 },
      requested: 5,
    });
    expect(r.cards.map((c) => c.source)).toEqual(["learning"]);
  });

  it("review limit 0 = tanpa batas", () => {
    const progress = Object.fromEntries(
      cards.slice(0, 5).map((c) => [c.id, makeProgress(c.id, "review", "2026-10-04T11:00:00")]),
    );
    const r = build({
      cards: cards.slice(0, 5), progress,
      limits: { dailyNew: 20, dailyReview: 0 },
      daily: { newCards: 0, reviewCards: 9999, learningCards: 0 },
      requested: 5,
    });
    expect(r.cards).toHaveLength(5);
  });
});

describe("session composition", () => {
  it("learning 3 + review 10 + new 7 untuk session 20", () => {
    const pool = HIRAGANA_BASIC.slice(0, 30);
    const progress: Record<string, CardProgress> = {};
    pool.slice(0, 3).forEach((c) => (progress[c.id] = makeProgress(c.id, "learning", "2026-10-04T11:00:00")));
    pool.slice(3, 13).forEach((c) => (progress[c.id] = makeProgress(c.id, "review", "2026-10-04T11:00:00")));
    const r = buildQueue({
      cards: pool, progress, mode: "recognition", requested: 20,
      limits, daily: emptyDaily, now: NOW,
    });
    const sources = r.cards.map((c) => c.source);
    expect(sources.slice(0, 3).every((s) => s === "learning")).toBe(true);
    expect(sources.filter((s) => s === "review")).toHaveLength(10);
    expect(sources.filter((s) => s === "new")).toHaveLength(7);
  });

  it("actual = min(requested, available)", () => {
    const r = build({ requested: 50 });
    expect(r.cards.length).toBeLessThanOrEqual(50);
    const r2 = build({ cards: cards.slice(0, 3), requested: 50 });
    expect(r2.cards).toHaveLength(3);
  });
});

describe("empty state", () => {
  it("tidak ada kartu → cards kosong + nextReviewAt terisi", () => {
    const [a] = cards;
    const progress = {
      [a.id]: makeProgress(a.id, "review", "2026-10-05T12:00:00"),
    };
    const r = build({ cards: [a], progress, requested: 10 });
    expect(r.cards).toHaveLength(0);
    expect(r.nextReviewAt).toBe("2026-10-05T12:00:00");
  });

  it("formatNextReview: jam dan besok", () => {
    expect(formatNextReview("2026-10-04T15:00:00", NOW)).toBe("3 jam lagi");
    expect(formatNextReview("2026-10-05T12:00:00", NOW)).toBe("Besok");
  });
});

describe("daily counters", () => {
  it("recordCardRated menambah counter kategori yang benar", () => {
    recordCardRated("new");
    recordCardRated("new");
    recordCardRated("review");
    recordCardRated("learning");
    const d = getDailyCounts();
    expect(d.newCards).toBe(2);
    expect(d.reviewCards).toBe(1);
    expect(d.learningCards).toBe(1);
  });

  it("counter per tanggal: tanggal lain mulai dari nol (midnight reset)", () => {
    recordCardRated("new");
    expect(getDailyCounts().newCards).toBe(1);
    expect(getDailyCounts("2099-01-01").newCards).toBe(0);
  });
});

describe("getTodaySummary", () => {
  it("menghitung learning due / review due / new", () => {
    const [cNew, cLearn, cReview] = cards;
    const progress = {
      [cLearn.id]: makeProgress(cLearn.id, "learning", "2026-10-04T11:00:00"),
      [cReview.id]: makeProgress(cReview.id, "review", "2026-10-04T11:00:00"),
    };
    const s = getTodaySummary({ cards: [cNew, cLearn, cReview], progress, limits, daily: emptyDaily, now: NOW });
    expect(s.learningDue).toBe(1);
    expect(s.reviewDue).toBe(1);
    expect(s.newAvailable).toBe(1);
  });

  it("suspended dikecualikan — konsisten dengan buildQueue", () => {
    const [cNew, cLearn, cReview] = cards;
    const progress = {
      [cLearn.id]: makeProgress(cLearn.id, "learning", "2026-10-04T11:00:00"),
      [cReview.id]: makeProgress(cReview.id, "review", "2026-10-04T11:00:00"),
    };
    const cardMeta = {
      [cLearn.id]: { favorite: false, suspended: true },
      [cReview.id]: { favorite: false, suspended: true },
    };
    const s = getTodaySummary({ cards: [cNew, cLearn, cReview], progress, limits, daily: emptyDaily, cardMeta, now: NOW });
    expect(s.learningDue).toBe(0);
    expect(s.reviewDue).toBe(0);
    expect(s.newAvailable).toBe(1);
  });

  it("reviewDue dibatasi daily review limit — konsisten dengan buildQueue", () => {
    const progress: Record<string, ReturnType<typeof makeProgress>> = {};
    for (const c of cards.slice(0, 5)) {
      progress[c.id] = makeProgress(c.id, "review", "2026-10-04T11:00:00");
    }
    const limited = { dailyNew: 20, dailyReview: 2 };
    const s = getTodaySummary({ cards: cards.slice(0, 5), progress, limits: limited, daily: emptyDaily, now: NOW });
    expect(s.reviewDue).toBe(2);
  });
});
