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
    importAll(JSON.stringify({ cardMetadata: { [id]: { favorite: "yes" } } }));
    expect(getCardMeta(id).favorite).toBe(true);
    importAll(JSON.stringify({ cardMetadata: "bukan-object" }));
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
