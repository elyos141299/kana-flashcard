import { describe, it, expect } from "vitest";
import { rateCard } from "../scheduler.js";
import { isMature, isDue } from "../types.js";
import type { CardProgress } from "../types.js";

const NOW = new Date("2026-10-04T10:00:00.000Z");
const min = 60_000;

function reviewCard(intervalDays: number): CardProgress {
  const iso = NOW.toISOString();
  return {
    cardId: "k1",
    state: "review",
    interval: intervalDays,
    ease: 2.5,
    dueAt: iso,
    learningStep: 0,
    reviewCount: 5,
    lapses: 0,
    lastReviewedAt: iso,
    createdAt: iso,
    previousInterval: null,
  };
}

describe("kartu NEW (§3)", () => {
  it("Again -> LEARNING, due +1 menit", () => {
    const p = rateCard(null, "a", "again", NOW);
    expect(p.state).toBe("learning");
    expect(p.learningStep).toBe(0);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 1 * min);
  });

  it("Hard -> LEARNING, due +5 menit", () => {
    const p = rateCard(null, "a", "hard", NOW);
    expect(p.state).toBe("learning");
    expect(p.learningStep).toBe(1);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 5 * min);
  });

  it("Good -> LEARNING, due +10 menit", () => {
    const p = rateCard(null, "a", "good", NOW);
    expect(p.state).toBe("learning");
    expect(p.learningStep).toBe(2);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 10 * min);
  });

  it("Easy -> langsung REVIEW, interval 4 hari", () => {
    const p = rateCard(null, "a", "easy", NOW);
    expect(p.state).toBe("review");
    expect(p.interval).toBe(4);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 4 * 86_400_000);
  });
});

describe("learning steps (§4): 1m -> 5m -> 10m -> graduate", () => {
  it("Again di tengah jalan kembali ke step 1 menit", () => {
    let p = rateCard(null, "a", "good", NOW); // step 2 (10m)
    p = rateCard(p, "a", "again", NOW);
    expect(p.learningStep).toBe(0);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 1 * min);
  });

  it("Hard tetap di step yang sama, due +5 menit", () => {
    const p0 = rateCard(null, "a", "again", NOW); // step 0
    const p = rateCard(p0, "a", "hard", NOW);
    expect(p.state).toBe("learning");
    expect(p.learningStep).toBe(0);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 5 * min);
  });

  it("Good naik step sampai graduate -> REVIEW interval 1 hari", () => {
    let p = rateCard(null, "a", "again", NOW); // step 0
    p = rateCard(p, "a", "good", NOW); // step 1
    expect(p.learningStep).toBe(1);
    p = rateCard(p, "a", "good", NOW); // step 2
    expect(p.learningStep).toBe(2);
    p = rateCard(p, "a", "good", NOW); // graduate
    expect(p.state).toBe("review");
    expect(p.interval).toBe(1);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 1 * 86_400_000);
  });

  it("Easy di learning langsung graduate interval 4 hari", () => {
    const p0 = rateCard(null, "a", "again", NOW);
    const p = rateCard(p0, "a", "easy", NOW);
    expect(p.state).toBe("review");
    expect(p.interval).toBe(4);
  });
});

describe("kartu REVIEW (§6)", () => {
  it("Again -> lapse: LEARNING +10 menit, interval lama disimpan", () => {
    const p = rateCard(reviewCard(20), "k1", "again", NOW);
    expect(p.state).toBe("learning");
    expect(p.lapses).toBe(1);
    expect(p.previousInterval).toBe(20);
    expect(new Date(p.dueAt).getTime()).toBe(NOW.getTime() + 10 * min);
  });

  it("setelah lapse + graduate -> interval = round(20 x 0.3) = 6 hari", () => {
    let p = rateCard(reviewCard(20), "k1", "again", NOW); // step 2
    p = rateCard(p, "k1", "good", NOW); // graduate
    expect(p.state).toBe("review");
    expect(p.interval).toBe(6);
    expect(p.previousInterval).toBeNull();
  });

  it("Hard: max(7 x 1.2, 7 + 1) = 8 hari", () => {
    const p = rateCard(reviewCard(7), "k1", "hard", NOW);
    expect(p.interval).toBe(8);
  });

  it("Good: 7 x 2.5 = 17.5 -> 18 hari", () => {
    const p = rateCard(reviewCard(7), "k1", "good", NOW);
    expect(p.interval).toBe(18);
  });

  it("Easy: 7 x 4 = 28 hari", () => {
    const p = rateCard(reviewCard(7), "k1", "easy", NOW);
    expect(p.interval).toBe(28);
  });
});

describe("batas interval (§7, §8)", () => {
  it("interval minimum 1 hari (lapse dari interval 1)", () => {
    let p = rateCard(reviewCard(1), "k1", "again", NOW);
    p = rateCard(p, "k1", "good", NOW); // graduate
    expect(p.interval).toBe(1);
  });

  it("interval maksimum 365 hari", () => {
    const p = rateCard(reviewCard(200), "k1", "good", NOW); // 200 x 2.5 = 500
    expect(p.interval).toBe(365);
  });

  it("interval maksimum 365 hari via Easy", () => {
    const p = rateCard(reviewCard(365), "k1", "easy", NOW); // 365 x 4
    expect(p.interval).toBe(365);
  });
});

describe("contoh §18: 1d -> Good -> 3d -> Good -> 8d -> Easy -> 32d", () => {
  it("rantai review sesuai contoh", () => {
    let p = rateCard(null, "x", "easy", NOW); // NEW+Easy -> review 4d... mulai dari 1d:
    p = { ...reviewCard(1) };
    p = rateCard(p, "x", "good", NOW);
    expect(p.interval).toBe(3); // 1 x 2.5 = 2.5 -> 3
    p = rateCard(p, "x", "good", NOW);
    expect(p.interval).toBe(8); // 3 x 2.5 = 7.5 -> 8
    p = rateCard(p, "x", "easy", NOW);
    expect(p.interval).toBe(32); // 8 x 4
  });
});

describe("helper", () => {
  it("isMature: review + interval >= 21", () => {
    expect(isMature(reviewCard(21))).toBe(true);
    expect(isMature(reviewCard(20))).toBe(false);
    expect(isMature({ ...reviewCard(30), state: "learning" })).toBe(false);
  });

  it("isDue: dueAt <= now", () => {
    const p = reviewCard(7);
    expect(isDue(p, NOW)).toBe(true);
    expect(isDue(p, new Date(NOW.getTime() - 1000))).toBe(false);
  });

  it("rateCard tidak mutasi input", () => {
    const p = reviewCard(7);
    const snapshot = { ...p };
    rateCard(p, "k1", "good", NOW);
    expect(p).toEqual(snapshot);
  });
});
