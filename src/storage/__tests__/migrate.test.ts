/**
 * Data versioning & migration (Phase 19).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  getSchemaVersion,
  setSchemaVersion,
  snapshotStorage,
  restoreStorage,
  runMigrations,
  ensureMigrated,
  validateProgress,
  validateStats,
  validateSettings,
  findOrphanedCardIds,
  type MigrationStep,
} from "../migrate.js";
import {
  exportAll,
  importAll,
  loadProgress,
  loadStats,
  loadSettings,
  saveProgress,
  saveStats,
  resetAll,
} from "../progress.js";
import { toggleFavorite, setSuspended, getCardMeta } from "../cardMeta.js";
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

const card = HIRAGANA_BASIC[0];

function seedProgress(n: number) {
  const p: Record<string, ReturnType<typeof prog>> = {};
  const cards = HIRAGANA_BASIC.slice(0, n);
  for (const c of cards) p[c.id] = prog(c.id);
  saveProgress(p as never);
  return cards;
}
function prog(cardId: string) {
  return {
    cardId, state: "review" as const, interval: 4, ease: 2.5,
    dueAt: "2026-10-10T00:00:00.000Z", learningStep: 0, reviewCount: 3,
    lapses: 1, lastReviewedAt: null, createdAt: "2026-09-01T00:00:00.000Z",
    previousInterval: 2,
  };
}

describe("ensureMigrated", () => {
  it("fresh install: tidak ada data → version diset, tidak ada data dibuat", () => {
    ensureMigrated();
    expect(getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
    expect(store.has("kana.progress.v1")).toBe(false);
  });

  it("current schema: tidak ada perubahan yang tidak diinginkan", () => {
    const cards = seedProgress(5);
    const before = store.get("kana.progress.v1");
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
    ensureMigrated();
    expect(store.get("kana.progress.v1")).toBe(before);
    expect(Object.keys(loadProgress()).length).toBe(5);
    expect(cards.length).toBe(5);
  });

  it("v0 (pre-versioning): adopsi data existing sebagai v1", () => {
    seedProgress(3);
    toggleFavorite(card.id);
    expect(getSchemaVersion()).toBe(0);
    ensureMigrated();
    expect(getSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
    expect(Object.keys(loadProgress()).length).toBe(3);
    expect(getCardMeta(card.id).favorite).toBe(true);
  });

  it("future version: jangan sentuh apa pun", () => {
    seedProgress(2);
    setSchemaVersion(99);
    ensureMigrated();
    expect(getSchemaVersion()).toBe(99);
    expect(Object.keys(loadProgress()).length).toBe(2);
  });
});

describe("runMigrations", () => {
  it("steps berjalan berurutan v1 → v2 → v3", () => {
    const order: string[] = [];
    const steps: MigrationStep[] = [
      { from: 1, to: 2, up: () => void order.push("1-2") },
      { from: 2, to: 3, up: () => void order.push("2-3") },
    ];
    setSchemaVersion(1);
    runMigrations(steps, 1, 3);
    expect(order).toEqual(["1-2", "2-3"]);
    expect(getSchemaVersion()).toBe(3);
  });

  it("migration gagal → original data direstore + throw", () => {
    seedProgress(4);
    const before = store.get("kana.progress.v1");
    setSchemaVersion(1);
    const steps: MigrationStep[] = [
      {
        from: 1, to: 2,
        up: () => {
          // simulasi migrasi yang merusak data lalu gagal
          store.set("kana.progress.v1", JSON.stringify({ rusak: true }));
          throw new Error("boom");
        },
      },
    ];
    expect(() => runMigrations(steps, 1, 2)).toThrow("boom");
    expect(store.get("kana.progress.v1")).toBe(before);
    expect(getSchemaVersion()).toBe(1);
    expect(Object.keys(loadProgress()).length).toBe(4);
  });

  it("step tidak ditemukan → throw tanpa merusak data", () => {
    seedProgress(2);
    const before = store.get("kana.progress.v1");
    setSchemaVersion(1);
    expect(() => runMigrations([], 1, 2)).toThrow();
    expect(store.get("kana.progress.v1")).toBe(before);
  });
});

describe("snapshot/restore", () => {
  it("round trip mengembalikan semua keys", () => {
    seedProgress(2);
    toggleFavorite(card.id);
    const snap = snapshotStorage();
    store.clear();
    expect(store.size).toBe(0);
    restoreStorage(snap);
    expect(Object.keys(loadProgress()).length).toBe(2);
    expect(getCardMeta(card.id).favorite).toBe(true);
  });
});

describe("import versioning", () => {
  it("schemaVersion masa depan → ditolak, data current utuh", () => {
    seedProgress(3);
    const before = store.get("kana.progress.v1");
    const bad = JSON.stringify({ schemaVersion: 999, progress: {} });
    expect(() => importAll(bad)).toThrow(/tidak didukung/);
    expect(store.get("kana.progress.v1")).toBe(before);
  });

  it("tanpa schemaVersion → dianggap v1 (export lama tetap bisa)", () => {
    const json = JSON.stringify({
      progress: { [card.id]: prog(card.id) },
      stats: { days: {}, streak: 0, lastActiveDate: null },
      settings: loadSettings(),
      cardMetadata: {},
    });
    const result = importAll(json);
    expect(result.ok).toBe(true);
    expect(result.migrated).toBe(false);
    expect(loadProgress()[card.id]).toBeDefined();
  });

  it("JSON korup → throw, data dilindungi", () => {
    seedProgress(2);
    const before = store.get("kana.progress.v1");
    expect(() => importAll("{bukan json")).toThrow();
    expect(store.get("kana.progress.v1")).toBe(before);
  });

  it("atomic: section invalid → tidak ada partial write", () => {
    seedProgress(2);
    const before = store.get("kana.progress.v1");
    const bad = JSON.stringify({
      schemaVersion: 1,
      progress: { [card.id]: { state: "bogus" } },
      stats: { days: {}, streak: 0, lastActiveDate: null },
    });
    expect(() => importAll(bad)).toThrow(/progress/);
    expect(store.get("kana.progress.v1")).toBe(before);
    expect(Object.keys(loadProgress()).length).toBe(2);
  });
});

describe("export/import round trip", () => {
  it("progress, stats, settings, favorite, suspend kembali sama", () => {
    const cards = seedProgress(10);
    saveStats({
      days: { "2026-10-04": { newCards: 5, reviewCards: 8, learningCards: 2, reviewed: 15, again: 1, hard: 2, good: 9, easy: 3 } },
      streak: 7,
      lastActiveDate: "2026-10-04",
    });
    toggleFavorite(cards[0].id);
    toggleFavorite(cards[1].id);
    setSuspended(cards[2].id, true);

    const json = exportAll();
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof parsed.appVersion).toBe("string");
    expect(typeof parsed.exportedAt).toBe("string");

    resetAll();
    store.delete("kana.cardmeta.v1");
    const result = importAll(json);
    expect(result.ok).toBe(true);

    expect(loadProgress()).toEqual(JSON.parse(json).progress);
    expect(loadStats().streak).toBe(7);
    expect(loadStats().days["2026-10-04"].reviewed).toBe(15);
    expect(getCardMeta(cards[0].id).favorite).toBe(true);
    expect(getCardMeta(cards[2].id).suspended).toBe(true);
  });
});

describe("no data loss", () => {
  it("100 progress + 20 favorite + 5 suspended + stats → migration → semua retained", () => {
    const all = HIRAGANA_BASIC;
    const p: Record<string, ReturnType<typeof prog>> = {};
    for (const c of all) p[c.id] = prog(c.id);
    saveProgress(p as never);
    const favIds = all.slice(0, 20).map((c) => c.id);
    const susIds = all.slice(20, 25).map((c) => c.id);
    for (const id of favIds) toggleFavorite(id);
    for (const id of susIds) setSuspended(id, true);
    saveStats({ days: { "2026-10-04": { newCards: 1, reviewCards: 1, learningCards: 1, reviewed: 3, again: 0, hard: 0, good: 3, easy: 0 } }, streak: 3, lastActiveDate: "2026-10-04" });

    // simulasi adoption v0 → v1
    expect(getSchemaVersion()).toBe(0);
    ensureMigrated();

    expect(Object.keys(loadProgress()).length).toBe(all.length);
    for (const id of favIds) expect(getCardMeta(id).favorite).toBe(true);
    for (const id of susIds) expect(getCardMeta(id).suspended).toBe(true);
    expect(loadStats().streak).toBe(3);
    // SRS values tidak berubah
    const sample = loadProgress()[all[0].id];
    expect(sample.interval).toBe(4);
    expect(sample.reviewCount).toBe(3);
    expect(sample.lapses).toBe(1);
  });
});

describe("validators", () => {
  it("validateProgress menolak record rusak", () => {
    expect(validateProgress(null)).toBe(null);
    expect(validateProgress({ a: { state: "review" } })).toBe(null);
    expect(validateProgress({ a: { cardId: "b", state: "review", interval: 1, dueAt: "x", reviewCount: 0, lapses: 0 } })).toBe(null);
    const ok = validateProgress({ [card.id]: prog(card.id) });
    expect(ok?.[card.id].state).toBe("review");
  });

  it("validateStats / validateSettings", () => {
    expect(validateStats({ days: {}, streak: 0, lastActiveDate: null })).not.toBe(null);
    expect(validateStats({ days: {}, streak: "x" })).toBe(null);
    expect(validateSettings(undefined)).toEqual(loadSettings());
    expect(validateSettings({ dailyNewLimit: 50 })).toMatchObject({ dailyNewLimit: 50 });
    expect(validateSettings(42)).toBe(null);
  });
});

describe("orphan detection", () => {
  it("unknown cardId dipertahankan dan dilaporkan", () => {
    const progress = {
      [card.id]: prog(card.id),
      "ghost-card-999": { ...prog("ghost-card-999"), cardId: "ghost-card-999" },
    };
    const report = findOrphanedCardIds(progress as never, {});
    expect(report.progress).toEqual(["ghost-card-999"]);

    const json = JSON.stringify({
      schemaVersion: 1,
      progress,
      stats: { days: {}, streak: 0, lastActiveDate: null },
      cardMetadata: { "ghost-meta-1": { favorite: true, suspended: false } },
    });
    const result = importAll(json);
    expect(result.ok).toBe(true);
    expect(result.orphanedProgress).toBe(1);
    expect(result.orphanedMeta).toBe(1);
    // data orphan tetap tersimpan (tidak dihapus diam-diam)
    expect(loadProgress()["ghost-card-999"]).toBeDefined();
  });
});

describe("reset behavior (Phase 16 tetap)", () => {
  it("reset menghapus progress+stats, mempertahankan favorite/suspend", () => {
    seedProgress(3);
    toggleFavorite(card.id);
    setSuspended(HIRAGANA_BASIC[1].id, true);
    resetAll();
    expect(Object.keys(loadProgress()).length).toBe(0);
    expect(getCardMeta(card.id).favorite).toBe(true);
    expect(getCardMeta(HIRAGANA_BASIC[1].id).suspended).toBe(true);
  });
});
