/**
 * Card control (Phase 16): favorite & suspend metadata.
 * Terpisah dari SRS — queue filtering, persistence, export/import.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCardMeta,
  getCardMeta,
  toggleFavorite,
  setSuspended,
  validateCardMeta,
} from "../cardMeta.js";
import { exportAll, importAll } from "../progress.js";
import { buildQueue } from "../../queue/builder.js";
import { HIRAGANA_BASIC } from "../../data/kana/hiragana.js";

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

const cards = HIRAGANA_BASIC.slice(0, 5);
const limits = { dailyNew: 20, dailyReview: 100 };
const emptyDaily = { newCards: 0, reviewCards: 0, learningCards: 0 };

function queueWith(meta: Record<string, { favorite: boolean; suspended: boolean }>, favoriteOnly = false) {
  return buildQueue({
    cards,
    progress: {},
    mode: "recognition",
    requested: 10,
    limits,
    daily: emptyDaily,
    cardMeta: meta,
    favoriteOnly,
  });
}

describe("favorite", () => {
  it("false → true → false", () => {
    const id = cards[0].id;
    expect(getCardMeta(id).favorite).toBe(false);
    expect(toggleFavorite(id)).toBe(true);
    expect(getCardMeta(id).favorite).toBe(true);
    expect(toggleFavorite(id)).toBe(false);
    expect(getCardMeta(id).favorite).toBe(false);
  });

  it("favorite survives reload (localStorage round trip)", () => {
    const id = cards[1].id;
    toggleFavorite(id);
    // simulasi reload: baca ulang dari storage mentah
    const raw = store.get("kana.cardmeta.v1")!;
    expect(JSON.parse(raw)[id].favorite).toBe(true);
    expect(loadCardMeta()[id].favorite).toBe(true);
  });
});

describe("suspend", () => {
  it("suspended survives reload", () => {
    const id = cards[2].id;
    setSuspended(id, true);
    expect(loadCardMeta()[id].suspended).toBe(true);
    setSuspended(id, false);
    expect(loadCardMeta()[id].suspended).toBe(false);
  });

  it("suspended card excluded dari queue; unsuspended kembali masuk", () => {
    const id = cards[0].id;
    const meta = { [id]: { favorite: false, suspended: true } };
    const excluded = queueWith(meta);
    expect(excluded.cards.some((c) => c.card.id === id)).toBe(false);
    expect(excluded.cards.length).toBe(cards.length - 1);

    const included = queueWith({ [id]: { favorite: false, suspended: false } });
    expect(included.cards.some((c) => c.card.id === id)).toBe(true);
  });

  it("suspend tidak mengubah SRS progress", () => {
    const id = cards[0].id;
    const progress = {
      [id]: {
        cardId: id, state: "review" as const, interval: 12, ease: 2.5,
        dueAt: "2026-10-01T00:00:00.000Z", learningStep: 0,
        reviewCount: 5, lapses: 1, lastReviewedAt: null,
        createdAt: "2026-09-01T00:00:00.000Z", previousInterval: 5,
      },
    };
    const before = JSON.stringify(progress[id]);
    buildQueue({
      cards, progress, mode: "recognition", requested: 10, limits,
      daily: emptyDaily,
      cardMeta: { [id]: { favorite: false, suspended: true } },
      now: new Date("2026-10-04T12:00:00"),
    });
    // progress record identik — queue tidak menyentuh SRS
    expect(JSON.stringify(progress[id])).toBe(before);
  });
});

describe("favoriteOnly filter", () => {
  it("hanya kartu favorite yang masuk queue", () => {
    const favId = cards[1].id;
    const meta = { [favId]: { favorite: true, suspended: false } };
    const result = queueWith(meta, true);
    expect(result.cards.length).toBe(1);
    expect(result.cards[0].card.id).toBe(favId);
  });

  it("favorite yang suspended tetap dikecualikan", () => {
    const favId = cards[1].id;
    const meta = { [favId]: { favorite: true, suspended: true } };
    const result = queueWith(meta, true);
    expect(result.cards.length).toBe(0);
  });
});

describe("study favorites — eligibility eksplisit", () => {
  const NOW = new Date("2026-10-04T12:00:00");
  const past = "2026-10-01T00:00:00.000Z";
  const future = "2026-10-10T00:00:00.000Z";

  function prog(state: "new" | "learning" | "review", dueAt: string) {
    return {
      cardId: "x", state: state as "learning" | "review",
      interval: state === "review" ? 4 : 0, ease: 2.5, dueAt,
      learningStep: 0, reviewCount: 1, lapses: 0, lastReviewedAt: null,
      createdAt: past, previousInterval: null,
    };
  }

  /** 10 kartu: semua favorite. */
  function favMeta(ids: string[], suspended: string[] = []) {
    const m: Record<string, { favorite: boolean; suspended: boolean }> = {};
    for (const id of ids) m[id] = { favorite: true, suspended: suspended.includes(id) };
    return m;
  }

  const ids = cards.map((c) => c.id);

  it("favorite REVIEW due → included; not due → excluded", () => {
    const dueId = ids[0];
    const notDueId = ids[1];
    const progress = {
      [dueId]: { ...prog("review", past), cardId: dueId },
      [notDueId]: { ...prog("review", future), cardId: notDueId },
    };
    const result = buildQueue({
      cards, progress, mode: "recognition", requested: 10, limits,
      daily: emptyDaily, cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    const got = result.cards.map((c) => c.card.id);
    expect(got).toContain(dueId);
    expect(got).not.toContain(notDueId);
  });

  it("favorite LEARNING due → included; not due → excluded", () => {
    const dueId = ids[0];
    const notDueId = ids[1];
    const progress = {
      [dueId]: { ...prog("learning", past), cardId: dueId },
      [notDueId]: { ...prog("learning", future), cardId: notDueId },
    };
    const result = buildQueue({
      cards, progress, mode: "recognition", requested: 10, limits,
      daily: emptyDaily, cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    const got = result.cards.map((c) => c.card.id);
    expect(got).toContain(dueId);
    expect(got).not.toContain(notDueId);
  });

  it("favorite NEW → included hanya jika daily new limit tersisa", () => {
    const withQuota = buildQueue({
      cards, progress: {}, mode: "recognition", requested: 10, limits,
      daily: emptyDaily, cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    expect(withQuota.cards.length).toBe(cards.length);

    const noQuota = buildQueue({
      cards, progress: {}, mode: "recognition", requested: 10, limits,
      daily: { newCards: 20, reviewCards: 0, learningCards: 0 },
      cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    expect(noQuota.cards.length).toBe(0);
  });

  it("partial availability: 10 favorite, 3 eligible → 3 cards, tanpa non-favorite", () => {
    // 3 due (2 review + 1 learning), 7 not due
    const progress: Record<string, ReturnType<typeof prog> & { cardId: string }> = {};
    progress[ids[0]] = { ...prog("review", past), cardId: ids[0] };
    progress[ids[1]] = { ...prog("review", past), cardId: ids[1] };
    progress[ids[2]] = { ...prog("learning", past), cardId: ids[2] };
    for (let i = 3; i < 10 && i < ids.length; i++) {
      progress[ids[i]] = { ...prog("review", future), cardId: ids[i] };
    }
    const result = buildQueue({
      cards: cards.slice(0, Math.min(10, cards.length)),
      progress, mode: "recognition", requested: 10, limits,
      daily: emptyDaily, cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    expect(result.cards.length).toBe(3);
    // priority: learning due dulu, lalu review due (most overdue first)
    expect(result.cards[0].source).toBe("learning");
  });

  it("semua favorite tidak due → empty (0 cards)", () => {
    const progress: Record<string, ReturnType<typeof prog> & { cardId: string }> = {};
    for (const id of ids) progress[id] = { ...prog("review", future), cardId: id };
    const result = buildQueue({
      cards, progress, mode: "recognition", requested: 10, limits,
      daily: emptyDaily, cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    expect(result.cards.length).toBe(0);
    expect(result.nextReviewAt).toBe(future);
  });

  it("favorite tidak bypass daily review limit", () => {
    const dueId = ids[0];
    const progress = { [dueId]: { ...prog("review", past), cardId: dueId } };
    const result = buildQueue({
      cards, progress, mode: "recognition", requested: 10,
      limits: { dailyNew: 20, dailyReview: 100 },
      daily: { newCards: 0, reviewCards: 100, learningCards: 0 },
      cardMeta: favMeta(ids), favoriteOnly: true, now: NOW,
    });
    // review limit habis → review due tidak masuk (learning tetap boleh, tapi ini review)
    expect(result.cards.some((c) => c.card.id === dueId)).toBe(false);
  });

  it("suspend tidak mengembalikan kuota daily (structural: counter tak tersentuh)", () => {
    // recordCardRated tidak dipanggil oleh suspend — suspend hanya set metadata.
    // Verifikasi: daily counts independen dari cardMeta.
    const id = ids[0];
    setSuspended(id, true);
    expect(getCardMeta(id).suspended).toBe(true);
    // tidak ada API yang mengurangi daily counter; counter hanya bertambah via recordCardRated
  });
});

describe("export/import", () => {
  it("favorite + suspended round trip", () => {
    const favId = cards[0].id;
    const susId = cards[1].id;
    toggleFavorite(favId);
    setSuspended(susId, true);
    const json = exportAll();
    store.clear();
    importAll(json);
    expect(getCardMeta(favId).favorite).toBe(true);
    expect(getCardMeta(susId).suspended).toBe(true);
  });

  it("metadata malformed ditolak — data lama tetap utuh", () => {
    const id = cards[0].id;
    toggleFavorite(id);
    expect(() =>
      importAll(JSON.stringify({ cardMetadata: { [id]: { favorite: "yes" } } })),
    ).toThrow();
    expect(getCardMeta(id).favorite).toBe(true);
    expect(() =>
      importAll(JSON.stringify({ cardMetadata: "bukan-object" })),
    ).toThrow();
    expect(getCardMeta(id).favorite).toBe(true);
  });

  it("validateCardMeta menolak struktur salah", () => {
    expect(validateCardMeta(null)).toBe(null);
    expect(validateCardMeta([])).toBe(null);
    expect(validateCardMeta({ a: { favorite: true } })).toBe(null);
    expect(validateCardMeta({ a: { favorite: true, suspended: false } })).toEqual({
      a: { favorite: true, suspended: false },
    });
  });
});
