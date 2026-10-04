import { useState } from "react";
import { loadProgress, loadSettings, loadStats, todayKey, getDailyCounts } from "../storage/progress.js";
import type { KanaScript } from "../data/kana/index.js";
import { selectKana, GROUP_LABELS, KANA_GROUPS } from "../data/kana/index.js";
import { selectKanji, countKanji } from "../data/kanji/index.js";

function pct(learned: number, total: number): number {
  return total === 0 ? 0 : Math.round((learned / total) * 100);
}

function ScriptBlock({ script, progress }: {
  script: KanaScript;
  progress: ReturnType<typeof loadProgress>;
}) {
  const total = selectKana(script, "all").length;
  const learned = selectKana(script, "all").filter((c) => progress[c.id]?.state === "review").length;
  const label = script === "hiragana" ? "Hiragana" : "Katakana";

  return (
    <div style={{ marginBottom: 18 }}>
      <div className="stat-row">
        <span>{label}</span>
        <span className="stat-val">{pct(learned, total)}%</span>
      </div>
      <div className="meter" aria-hidden="true">
        <div style={{ width: `${pct(learned, total)}%` }} />
      </div>
      {KANA_GROUPS.map((g) => {
        const cards = selectKana(script, g);
        const done = cards.filter((c) => progress[c.id]?.state === "review").length;
        return (
          <div className="stat-row" key={g} style={{ fontSize: 14, padding: "8px 0" }}>
            <span style={{ color: "var(--ink-soft)" }}>{GROUP_LABELS[g]}</span>
            <span>{done}/{cards.length}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Progress() {
  const [stats] = useState(loadStats);
  const [progress] = useState(loadProgress);
  const [settings] = useState(loadSettings);
  const today = stats.days[todayKey()];
  const daily = getDailyCounts();

  return (
    <div className="page">
      <h1 className="page-title">Progress</h1>

      <p className="section-label">Today</p>
      <div className="stat-row">
        <span>New</span>
        <span className="stat-val">{daily.newCards} / {settings.dailyNewLimit}</span>
      </div>
      <div className="stat-row">
        <span>Reviews</span>
        <span className="stat-val">
          {daily.reviewCards} / {settings.dailyReviewLimit === 0 ? "∞" : settings.dailyReviewLimit}
        </span>
      </div>
      <div className="stat-row">
        <span>Learning</span>
        <span className="stat-val">{daily.learningCards}</span>
      </div>

      <hr className="divider" />

      <div className="stat-row">
        <span>Cards reviewed</span>
        <span className="stat-val">{today?.reviewed ?? 0}</span>
      </div>
      <div className="stat-row">
        <span>Again / Hard</span>
        <span className="stat-val">{(today?.again ?? 0) + (today?.hard ?? 0)}</span>
      </div>
      <div className="stat-row">
        <span>Good / Easy</span>
        <span className="stat-val">{(today?.good ?? 0) + (today?.easy ?? 0)}</span>
      </div>

      <hr className="divider" />

      <p className="section-label">Streak</p>
      <div className="summary-big">🔥 {stats.streak}</div>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>days in a row</p>

      <hr className="divider" />

      <p className="section-label">Kana</p>
      <ScriptBlock script="hiragana" progress={progress} />
      <ScriptBlock script="katakana" progress={progress} />

      <hr className="divider" />

      <p className="section-label">Kanji</p>
      {(["N5", "N4", "N3", "N2", "N1"] as const).map((level) => {
        const total = countKanji(level);
        const learned = selectKanji(level).filter((c) => progress[c.id]?.state === "review").length;
        return (
          <div key={level}>
            <div className="stat-row">
              <span>{level}</span>
              <span className="stat-val">{learned} / {total}</span>
            </div>
            <div className="meter" aria-hidden="true">
              <div style={{ width: `${pct(learned, total)}%` }} />
            </div>
          </div>
        );
      })}
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        N5–N1 Study Set — bukan daftar resmi JLPT.
      </p>
    </div>
  );
}
