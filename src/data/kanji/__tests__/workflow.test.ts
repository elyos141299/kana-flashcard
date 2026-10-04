/**
 * Integration test workflow: Study → Kanji → N5 → choose cards → Start
 * → show Kanji → reveal → rating → next card → progress updated.
 *
 * Menguji alur logika memakai modul asli (selectKanji + rateCard + definisi
 * "learned" yang sama dengan UI). Render React diverifikasi lewat QA browser.
 */
import { describe, it, expect } from "vitest";
import { selectKanji } from "../index.js";
import { rateCard } from "../../../srs/scheduler.js";
import type { CardProgress } from "../../../srs/types.js";

describe("workflow kanji N5 (§20)", () => {
  it("Study → Kanji → N5 → 10 cards → Start", () => {
    // simulasi Study.start(): pilih N5, slice 10
    const cards = selectKanji("N5").slice(0, 10);
    expect(cards).toHaveLength(10);
    expect(cards[0].type).toBe("kanji");
  });

  it("jika count > tersedia, pakai yang tersedia (tanpa duplicate)", () => {
    const total = selectKanji("N5").length;
    const cards = selectKanji("N5").slice(0, 999);
    expect(cards.length).toBe(total);
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rating memakai SRS engine yang sama (NEW + Good → LEARNING 10m)", () => {
    const card = selectKanji("N5")[0];
    const p: CardProgress = rateCard(null, card.id, "good");
    expect(p.state).toBe("learning");
    expect(p.cardId).toBe(card.id);
  });

  it("progress updated: kartu graduate → dihitung learned (state REVIEW)", () => {
    const card = selectKanji("N5")[0];
    // NEW + Easy → langsung REVIEW
    let p = rateCard(null, card.id, "easy");
    expect(p.state).toBe("review");
    // definisi "learned" di Progress.tsx
    const learned = [p].filter((x) => x.state === "review").length;
    expect(learned).toBe(1);
  });

  it("kartu LEARNING belum dihitung learned", () => {
    const card = selectKanji("N5")[1];
    const p = rateCard(null, card.id, "good"); // → learning
    const learned = [p].filter((x) => x.state === "review").length;
    expect(learned).toBe(0);
  });

  it("ID kanji tidak bertabrakan dengan ID kana", () => {
    const ids = selectKanji("N5").map((c) => c.id);
    expect(ids.every((id) => id.startsWith("kanji-"))).toBe(true);
  });

  it("workflow N4: Study → Kanji → N4 → 10 cards → Start → rating → progress", () => {
    // N4 = new set, bukan ulangan N5
    const n4 = selectKanji("N4").slice(0, 10);
    const n5ids = new Set(selectKanji("N5").map((c) => c.id));
    expect(n4).toHaveLength(10);
    expect(n4.every((c) => c.level === "N4")).toBe(true);
    expect(n4.every((c) => !n5ids.has(c.id))).toBe(true);
    // rating via SRS engine yang sama
    const p: CardProgress = rateCard(null, n4[0].id, "easy");
    expect(p.state).toBe("review");
    expect(p.cardId).toBe(n4[0].id);
  });

  it("N4 memakai definisi learned yang sama (state REVIEW)", () => {
    const card = selectKanji("N4")[0];
    const graduated = rateCard(null, card.id, "easy");
    const learning = rateCard(null, selectKanji("N4")[1].id, "good");
    expect([graduated].filter((x) => x.state === "review")).toHaveLength(1);
    expect([learning].filter((x) => x.state === "review")).toHaveLength(0);
  });

  it("workflow N3: Study → Kanji → N3 → 10 cards → Start → rating → progress", () => {
    const n3 = selectKanji("N3").slice(0, 10);
    const n5ids = new Set(selectKanji("N5").map((c) => c.id));
    const n4ids = new Set(selectKanji("N4").map((c) => c.id));
    expect(n3).toHaveLength(10);
    expect(n3.every((c) => c.level === "N3")).toBe(true);
    expect(n3.every((c) => !n5ids.has(c.id) && !n4ids.has(c.id))).toBe(true);
    const p: CardProgress = rateCard(null, n3[0].id, "good");
    expect(p.state).toBe("learning");
    expect(p.cardId).toBe(n3[0].id);
    const g: CardProgress = rateCard(null, n3[1].id, "easy");
    expect([g].filter((x) => x.state === "review")).toHaveLength(1);
  });

  it("workflow N2: Study → Kanji → N2 → 10 cards → Start → rating → progress", () => {
    const n2 = selectKanji("N2").slice(0, 10);
    const lowerIds = new Set(
      [...selectKanji("N5"), ...selectKanji("N4"), ...selectKanji("N3")].map((c) => c.id)
    );
    expect(n2).toHaveLength(10);
    expect(n2.every((c) => c.level === "N2")).toBe(true);
    expect(n2.every((c) => !lowerIds.has(c.id))).toBe(true);
    const p: CardProgress = rateCard(null, n2[0].id, "hard");
    expect(p.state).toBe("learning");
    const g: CardProgress = rateCard(null, n2[1].id, "easy");
    expect([g].filter((x) => x.state === "review")).toHaveLength(1);
  });

  it("workflow N1 (§17): Study → Kanji → N1 → 10 → Start → Front → Reveal → rating → Next → Progress", () => {
    // semua level bawah
    const lowerIds = new Set(
      [...selectKanji("N5"), ...selectKanji("N4"), ...selectKanji("N3"), ...selectKanji("N2")].map(
        (c) => c.id
      )
    );
    const n1 = selectKanji("N1").slice(0, 10);
    expect(n1).toHaveLength(10);
    expect(n1.every((c) => c.level === "N1")).toBe(true);
    expect(n1.every((c) => c.type === "kanji")).toBe(true);
    expect(n1.every((c) => !lowerIds.has(c.id))).toBe(true);
    // Front: karakter saja (data); Reveal: reading+meaning tersedia
    expect(n1[0].character.length).toBeGreaterThan(0);
    expect(n1[0].meanings.length).toBeGreaterThan(0);
    // Again/Hard/Good/Easy via engine yang sama
    const states = (["again", "hard", "good", "easy"] as const).map(
      (r, i) => rateCard(null, n1[i].id, r).state
    );
    expect(states).toEqual(["learning", "learning", "learning", "review"]);
    // Next card: ID berbeda, urutan deterministic
    expect(n1[1].id).not.toBe(n1[0].id);
    // Progress: definisi learned tetap state REVIEW
    const graduated = rateCard(null, n1[4].id, "easy");
    expect([graduated].filter((x) => x.state === "review")).toHaveLength(1);
  });
});
