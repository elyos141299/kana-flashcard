import { useMemo, useState } from "react";
import type { TabId } from "../components/TabBar.js";
import { loadProgress, loadSettings, loadStats, getDailyCounts } from "../storage/progress.js";
import { loadCardMeta } from "../storage/cardMeta.js";
import { selectKana } from "../data/kana/index.js";
import { selectKanji } from "../data/kanji/index.js";
import { getTodaySummary, formatNextReview } from "../queue/index.js";

const KANJI_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

function allCards() {
  return [
    ...selectKana("hiragana", "all"),
    ...selectKana("katakana", "all"),
    ...KANJI_LEVELS.flatMap((l) => selectKanji(l)),
  ];
}

export function Home({ go }: { go: (t: TabId) => void }) {
  const [stats] = useState(loadStats);
  const today = getDailyCounts();

  const summary = useMemo(() => {
    const settings = loadSettings();
    return getTodaySummary({
      cards: allCards(),
      progress: loadProgress(),
      limits: { dailyNew: settings.dailyNewLimit, dailyReview: settings.dailyReviewLimit },
      daily: today,
      cardMeta: loadCardMeta(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasDue = summary.learningDue + summary.reviewDue + summary.newAvailable > 0;

  return (
    <div className="page">
      <div className="brand-jp" lang="ja">日本語</div>
      <p className="brand-sub">Japanese Flashcards</p>

      <p className="section-label">Today · Hari ini</p>
      {hasDue ? (
        <>
          <div className="summary-big">{summary.learningDue + summary.reviewDue + summary.newAvailable}</div>
          <p style={{ color: "var(--ink-soft)", margin: "0 0 4px" }}>
            {[
              summary.reviewDue > 0 ? `${summary.reviewDue} review due` : null,
              summary.learningDue > 0 ? `${summary.learningDue} learning` : null,
              summary.newAvailable > 0 ? `${summary.newAvailable} kartu baru` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <button className="btn btn-primary" onClick={() => go("study")} style={{ marginTop: 12 }}>
            Start Study
          </button>
        </>
      ) : (
        <>
          <div className="summary-big" lang="ja">完</div>
          <p style={{ color: "var(--ink-soft)", margin: "0 0 4px" }}>All caught up</p>
          {summary.nextReviewAt && (
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
              Next review: {formatNextReview(summary.nextReviewAt)}
            </p>
          )}
        </>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => go("study")}>あ Hiragana</button>
        <button className="btn" onClick={() => go("study")}>ア Katakana</button>
        <button className="btn" onClick={() => go("study")}>漢 Kanji</button>
      </div>

      <hr className="divider" />

      <p className="section-label">今日の復習 · Today's Review</p>
      <div className="summary-big">{today.newCards + today.reviewCards + today.learningCards}</div>
      <p style={{ color: "var(--ink-soft)", margin: "0 0 18px" }}>cards reviewed today</p>

      <div className="stat-row">
        <span>Streak</span>
        <span className="stat-val">🔥 {stats.streak} day{stats.streak === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
