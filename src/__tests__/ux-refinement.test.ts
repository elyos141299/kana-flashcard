/**
 * Regression UX Phase 13: reveal privacy & level availability.
 * Render komponen ke static markup (tanpa browser) dan pastikan
 * jawaban tidak bocor di depan kartu.
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Flashcard } from "../components/Flashcard.js";
import { KanjiFlashcard } from "../components/KanjiFlashcard.js";
import { HIRAGANA_BASIC } from "../data/kana/hiragana.js";
import { KANJI_N5 } from "../data/kanji/n5.js";
import { selectKanji } from "../data/kanji/index.js";
import { buildSessionCard } from "../study/modes.js";

const noop = () => {};

function frontOf(html: string): string {
  return html.split("card-face card-back")[0];
}

describe("reveal privacy — recognition", () => {
  it("kana front hanya karakter, tanpa romaji", () => {
    const card = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    const html = renderToStaticMarkup(
      createElement(Flashcard, { card, index: 0, total: 10, onRate: noop }),
    );
    const front = frontOf(html);
    expect(front).toContain("ね");
    expect(front).not.toContain("NE");
  });

  it("kanji front hanya karakter, tanpa reading/meaning", () => {
    const card = KANJI_N5.find((c) => c.character === "日")!;
    const html = renderToStaticMarkup(
      createElement(KanjiFlashcard, { card, index: 0, total: 10, onRate: noop }),
    );
    const front = frontOf(html);
    expect(front).toContain("日");
    expect(front).not.toContain("kanji-reading");
    expect(front).not.toContain("kanji-meanings");
  });
});

describe("reveal privacy — recall", () => {
  it("kana recall front: prompt tampil, karakter jawaban tidak bocor", () => {
    const card = HIRAGANA_BASIC.find((c) => c.character === "ね")!;
    const sc = buildSessionCard(card, "recall");
    const html = renderToStaticMarkup(
      createElement(Flashcard, { card, index: 0, total: 10, mode: "recall", prompt: sc.prompt, onRate: noop }),
    );
    const front = frontOf(html);
    expect(front).toContain("NE");
    expect(front).not.toContain(">ね<");
  });

  it("kanji recall front: prompt reading tampil, karakter jawaban tidak bocor", () => {
    const card = KANJI_N5.find((c) => c.character === "日")!;
    const sc = buildSessionCard(card, "recall");
    const html = renderToStaticMarkup(
      createElement(KanjiFlashcard, { card, index: 0, total: 10, mode: "recall", prompt: sc.prompt, onRate: noop }),
    );
    const front = frontOf(html);
    expect(front).toContain(sc.prompt!);
    expect(front).not.toContain(">日<");
  });

  it("tidak ada tombol audio jawaban sebelum reveal", () => {
    const card = KANJI_N5.find((c) => c.character === "日")!;
    const sc = buildSessionCard(card, "recall");
    const html = renderToStaticMarkup(
      createElement(KanjiFlashcard, { card, index: 0, total: 10, mode: "recall", prompt: sc.prompt, onRate: noop }),
    );
    expect(frontOf(html)).not.toContain("audio-btn");
  });
});

describe("screen-reader privacy — aria-hidden pada sisi kartu", () => {
  it("kana: back face aria-hidden sebelum reveal", () => {
    const html = renderToStaticMarkup(
      createElement(Flashcard, {
        card: HIRAGANA_BASIC[0],
        index: 0,
        total: 10,
        onRate: noop,
      }),
    );
    expect(html).toContain('card-face card-back" aria-hidden="true"');
    // front face terbaca (aria-hidden="false" atau tidak ada true)
    expect(html).not.toContain('card-face card-front" aria-hidden="true"');
  });

  it("kanji: back face aria-hidden sebelum reveal", () => {
    const html = renderToStaticMarkup(
      createElement(KanjiFlashcard, {
        card: KANJI_N5[0],
        index: 0,
        total: 10,
        onRate: noop,
      }),
    );
    expect(html).toContain('card-face card-back kanji-back" aria-hidden="true"');
    expect(html).not.toContain('card-face card-front" aria-hidden="true"');
  });
});

describe("kanji levels availability", () => {
  it("semua level N5–N1 tersedia dan tidak kosong (tidak ada yang disabled)", () => {
    for (const level of ["N5", "N4", "N3", "N2", "N1"] as const) {
      expect(selectKanji(level).length).toBeGreaterThan(0);
    }
  });
});
