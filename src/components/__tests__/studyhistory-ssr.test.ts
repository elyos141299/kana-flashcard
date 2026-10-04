/** Throwaway SSR check untuk StudyHistory (tidak di-commit). */
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { StudyHistory } from "../StudyHistory.js";
import type { DayStats } from "../../storage/progress.js";

const day = (reviewed: number, n = 0, l = 0, r = 0): DayStats => ({
  reviewed, again: 0, hard: 0, good: reviewed, easy: 0,
  newCards: n, reviewCards: r, learningCards: l,
});

describe("StudyHistory SSR", () => {
  it("render 30 hari + detail", () => {
    const days: Record<string, DayStats> = {
      "2026-10-04": day(20, 8, 4, 8),
      "2026-10-01": day(35, 10, 10, 15),
    };
    const html = renderToString(createElement(StudyHistory, { days }));
    // header weekday
    for (const w of ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"])
      expect(html).toContain(w);
    // range selector
    expect(html).toContain("7 Hari");
    expect(html).toContain("30 Hari");
    expect(html).toContain("Semua");
    // 30 sel heatmap (class heat-cell)
    const cells = (html.match(/heat-cell/g) ?? []).length;
    expect(cells).toBe(30);
    // aria-label dengan jumlah benar
    expect(html).toContain("35 kartu dipelajari");
    // detail default = hari ini
    expect(html).toContain("20");
    expect(html).toContain("cards studied");
    // intensitas: 35 -> heat-4, 20 -> heat-3
    expect(html).toContain("heat-4");
    expect(html).toContain("heat-3");
  });

  it("hari kosong -> No study activity", () => {
    const html = renderToString(createElement(StudyHistory, { days: {} }));
    expect(html).toContain("No study activity");
  });
});
