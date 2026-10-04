/** Phase 24 — tests untuk logika rentang Study History. */
import { describe, it, expect } from "vitest";
import {
  buildDateKeys,
  fromKey,
  mondayIndex,
  prettyDate,
  toKey,
  weekdayName,
} from "../dates.js";

const TODAY = new Date(2026, 9, 4); // Minggu, 4 Okt 2026 (lokal)

describe("toKey / fromKey", () => {
  it("round-trip", () => {
    expect(toKey(TODAY)).toBe("2026-10-04");
    expect(fromKey("2026-10-04")?.getTime()).toBe(TODAY.getTime());
  });

  it("key invalid -> null", () => {
    expect(fromKey("bukan-tanggal")).toBeNull();
    expect(fromKey("2026-13-99")).toBeNull();
  });
});

describe("buildDateKeys", () => {
  it("7 hari: berakhir hari ini, 7 key", () => {
    const keys = buildDateKeys(7, {}, TODAY);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe("2026-09-28");
    expect(keys[6]).toBe("2026-10-04");
  });

  it("30 hari: berakhir hari ini, 30 key", () => {
    const keys = buildDateKeys(30, {}, TODAY);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-09-05");
    expect(keys[29]).toBe("2026-10-04");
  });

  it("all: dari data paling awal sampai hari ini, termasuk hari kosong", () => {
    const days = {
      "2026-10-01": {},
      "2026-09-20": {},
      "2026-10-04": {},
    };
    const keys = buildDateKeys("all", days, TODAY);
    expect(keys[0]).toBe("2026-09-20");
    expect(keys[keys.length - 1]).toBe("2026-10-04");
    // 20 Sep -> 4 Okt = 15 hari, termasuk gap tanpa data
    expect(keys).toHaveLength(15);
    expect(keys).toContain("2026-09-25"); // gap tetap muncul (kosong)
  });

  it("all: key invalid diabaikan", () => {
    const keys = buildDateKeys("all", { "xxx": {}, "2026-10-02": {} }, TODAY);
    expect(keys[0]).toBe("2026-10-02");
  });

  it("all: tanpa data -> []", () => {
    expect(buildDateKeys("all", {}, TODAY)).toEqual([]);
  });

  it("tanggal diurut menaik", () => {
    const keys = buildDateKeys(7, {}, TODAY);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});

describe("weekday helpers", () => {
  it("mondayIndex: Senin=0, Minggu=6", () => {
    expect(mondayIndex(new Date(2026, 9, 5))).toBe(0); // Senin
    expect(mondayIndex(new Date(2026, 9, 4))).toBe(6); // Minggu
  });

  it("prettyDate + weekdayName", () => {
    expect(prettyDate("2026-10-04")).toBe("4 Okt 2026");
    expect(weekdayName("2026-10-04")).toBe("Minggu");
    expect(weekdayName("2026-10-05")).toBe("Senin");
  });
});
