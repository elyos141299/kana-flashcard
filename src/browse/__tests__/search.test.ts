/**
 * Card Browser (Phase 17): search, filter, eligibility.
 */
import { describe, it, expect } from "vitest";
import {
  matchesCard,
  searchCards,
  filterCards,
  studyEligibility,
  DEFAULT_FILTERS,
  type AnyCard,
} from "../search.js";
import { HIRAGANA_BASIC, HIRAGANA_COMBINATION } from "../../data/kana/hiragana.js";
import { KATAKANA_BASIC } from "../../data/kana/katakana.js";
import { KANJI_N5 } from "../../data/kanji/n5.js";
import { KANJI_N4 } from "../../data/kanji/index.js";
import type { CardProgress } from "../../srs/types.js";

const ne = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
const kya = HIRAGANA_COMBINATION.find((c) => c.character === "きゃ")!;
const neKata = KATAKANA_BASIC.find((c) => c.character === "ネ")!;
const gaku = KANJI_N5.find((c) => c.character === "日")!;
const hon = KANJI_N5.find((c) => c.character === "一")!;

const all: AnyCard[] = [...HIRAGANA_BASIC, ...KATAKANA_BASIC, ...KANJI_N5, ...KANJI_N4];
const limits = { dailyNew: 20, dailyReview: 100 };
const emptyDaily = { newCards: 0, reviewCards: 0, learningCards: 0 };
const NOW = new Date("2026-10-04T12:00:00");

function prog(cardId: string, state: "learning" | "review", dueAt: string): CardProgress {
  return {
    cardId, state, interval: state === "review" ? 4 : 0, ease: 2.5, dueAt,
    learningStep: 0, reviewCount: 1, lapses: 0, lastReviewedAt: null,
    createdAt: "2026-09-01T00:00:00.000Z", previousInterval: null,
  };
}

describe("search", () => {
  it("ね menemukan ね", () => {
    const r = searchCards(all, "ね");
    expect(r.some((c) => c.id === ne.id)).toBe(true);
  });
  it("NE menemukan ね (case-insensitive romaji)", () => {
    const r = searchCards(all, "NE");
    expect(r.some((c) => c.id === ne.id)).toBe(true);
  });
  it("ne kecil juga menemukan ね", () => {
    expect(searchCards(all, "ne").some((c) => c.id === ne.id)).toBe(true);
  });
  it("日 menemukan 日", () => {
    const r = searchCards(all, "日");
    expect(r.some((c) => c.id === gaku.id)).toBe(true);
  });
  it("にち menemukan 日 (reading)", () => {
    const r = searchCards(all, "にち");
    expect(r.some((c) => c.id === gaku.id)).toBe(true);
  });
  it("query kosong mengembalikan semua", () => {
    expect(searchCards(all, "   ").length).toBe(all.length);
  });
  it("tidak ditemukan → kosong (bukan error)", () => {
    expect(searchCards(all, "zzzznotacard")).toEqual([]);
  });
  it("matchesCard: きゃ tidak match きや", () => {
    expect(matchesCard(kya, "きゃ")).toBe(true);
  });
});

describe("filter", () => {
  it("kana + hiragana", () => {
    const r = filterCards(all, { ...DEFAULT_FILTERS, dataset: "kana", script: "hiragana" }, {}, {});
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.type === "kana" && (c as { script: string }).script === "hiragana")).toBe(true);
  });
  it("kana + katakana", () => {
    const r = filterCards(all, { ...DEFAULT_FILTERS, dataset: "kana", script: "katakana" }, {}, {});
    expect(r.some((c) => c.id === neKata.id)).toBe(true);
    expect(r.some((c) => c.id === ne.id)).toBe(false);
  });
  it("kanji N5", () => {
    const r = filterCards(all, { ...DEFAULT_FILTERS, dataset: "kanji", level: "N5" }, {}, {});
    expect(r.some((c) => c.id === gaku.id)).toBe(true);
    expect(r.every((c) => c.type === "kanji" && (c as { level: string }).level === "N5")).toBe(true);
  });
  it("kanji N4", () => {
    const r = filterCards(all, { ...DEFAULT_FILTERS, dataset: "kanji", level: "N4" }, {}, {});
    expect(r.length).toBe(KANJI_N4.length);
  });
  it("status favorite", () => {
    const r = filterCards(
      all, { ...DEFAULT_FILTERS, status: "favorite" }, {},
      { [gaku.id]: { favorite: true, suspended: false } },
    );
    expect(r.map((c) => c.id)).toEqual([gaku.id]);
  });
  it("status suspended", () => {
    const r = filterCards(
      all, { ...DEFAULT_FILTERS, status: "suspended" }, {},
      { [ne.id]: { favorite: false, suspended: true } },
    );
    expect(r.map((c) => c.id)).toEqual([ne.id]);
  });
  it("status due / new / learning / review", () => {
    const progress = {
      [gaku.id]: prog(gaku.id, "review", "2026-10-01T00:00:00.000Z"),
      [hon.id]: prog(hon.id, "learning", "2026-10-01T00:00:00.000Z"),
    };
    expect(
      filterCards(all, { ...DEFAULT_FILTERS, status: "due" }, progress, {}, NOW).map((c) => c.id),
    ).toEqual(expect.arrayContaining([gaku.id, hon.id]));
    expect(
      filterCards(all, { ...DEFAULT_FILTERS, status: "new" }, progress, {}, NOW).some((c) => c.id === ne.id),
    ).toBe(true);
    expect(
      filterCards(all, { ...DEFAULT_FILTERS, status: "learning" }, progress, {}, NOW).map((c) => c.id),
    ).toEqual([hon.id]);
    expect(
      filterCards(all, { ...DEFAULT_FILTERS, status: "review" }, progress, {}, NOW).map((c) => c.id),
    ).toEqual([gaku.id]);
  });
  it("kombinasi: kanji + N5 + favorite", () => {
    const r = filterCards(
      all,
      { ...DEFAULT_FILTERS, dataset: "kanji", level: "N5", status: "favorite" },
      {},
      { [gaku.id]: { favorite: true, suspended: false }, [ne.id]: { favorite: true, suspended: false } },
    );
    expect(r.map((c) => c.id)).toEqual([gaku.id]);
  });
});

describe("studyEligibility", () => {
  it("due card → session", () => {
    const progress = { [gaku.id]: prog(gaku.id, "review", "2026-10-01T00:00:00.000Z") };
    expect(studyEligibility(gaku, progress, {}, emptyDaily, limits, NOW).kind).toBe("session");
  });
  it("non-due → preview only", () => {
    const progress = { [gaku.id]: prog(gaku.id, "review", "2026-10-10T00:00:00.000Z") };
    expect(studyEligibility(gaku, progress, {}, emptyDaily, limits, NOW).kind).toBe("preview");
  });
  it("suspended → blocked-suspended", () => {
    const progress = { [gaku.id]: prog(gaku.id, "review", "2026-10-01T00:00:00.000Z") };
    const meta = { [gaku.id]: { favorite: false, suspended: true } };
    expect(studyEligibility(gaku, progress, meta, emptyDaily, limits, NOW).kind).toBe("blocked-suspended");
  });
  it("new + limit tersedia → session; limit habis → blocked-limit", () => {
    expect(studyEligibility(ne, {}, {}, emptyDaily, limits, NOW).kind).toBe("session");
    const full = { newCards: 20, reviewCards: 0, learningCards: 0 };
    const r = studyEligibility(ne, {}, {}, full, limits, NOW);
    expect(r.kind).toBe("blocked-limit");
    if (r.kind === "blocked-limit") expect(r.reason).toBe("new");
  });
  it("review due + review limit habis → blocked-limit", () => {
    const progress = { [gaku.id]: prog(gaku.id, "review", "2026-10-01T00:00:00.000Z") };
    const full = { newCards: 0, reviewCards: 100, learningCards: 0 };
    const r = studyEligibility(gaku, progress, {}, full, limits, NOW);
    expect(r.kind).toBe("blocked-limit");
  });
  it("learning due tetap session walau review limit habis (spt queue)", () => {
    const progress = { [hon.id]: prog(hon.id, "learning", "2026-10-01T00:00:00.000Z") };
    const full = { newCards: 0, reviewCards: 100, learningCards: 0 };
    expect(studyEligibility(hon, progress, {}, full, limits, NOW).kind).toBe("session");
  });
});
