import { useState } from "react";
import type { TabId } from "../components/TabBar.js";
import { loadStats, todayKey } from "../storage/progress.js";

export function Home({ go }: { go: (t: TabId) => void }) {
  const [stats] = useState(loadStats);
  const today = stats.days[todayKey()];
  const reviewedToday = today?.reviewed ?? 0;

  return (
    <div className="page">
      <div className="brand-jp" lang="ja">日本語</div>
      <p className="brand-sub">Japanese Flashcards</p>

      <button className="btn btn-primary" onClick={() => go("study")}>
        Continue Learning
      </button>

      <div className="btn-row">
        <button className="btn" onClick={() => go("study")}>あ Hiragana</button>
        <button className="btn" onClick={() => go("study")}>ア Katakana</button>
        <button className="btn" onClick={() => go("study")}>漢 Kanji</button>
      </div>

      <hr className="divider" />

      <p className="section-label">今日の復習 · Today's Review</p>
      <div className="summary-big">{reviewedToday}</div>
      <p style={{ color: "var(--ink-soft)", margin: "0 0 18px" }}>cards reviewed today</p>

      <div className="stat-row">
        <span>Streak</span>
        <span className="stat-val">🔥 {stats.streak} day{stats.streak === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
