import { useState } from "react";
import { loadProgress, loadSettings, loadStats, todayKey, getDailyCounts } from "../storage/progress.js";
import { loadCardMeta, toggleFavorite, setSuspended } from "../storage/cardMeta.js";
import { getCardById, cardSubLabel } from "../data/cards.js";
import { isDue } from "../srs/types.js";
import { formatNextReview } from "../queue/index.js";
import { StudyHistory } from "../components/StudyHistory.js";
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
        <span className="stat-val">{learned} / {total}</span>
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
  const [meta, setMeta] = useState(loadCardMeta);
  const today = stats.days[todayKey()];
  const daily = getDailyCounts();

  // Daftar kartu favorite / suspended dari metadata (refresh saat ada aksi).
  // Favorites view: semua favorite yang TIDAK suspended (suspended ada di list sendiri).
  const favorites = Object.keys(meta)
    .filter((id) => meta[id].favorite && !meta[id].suspended)
    .map(getCardById)
    .filter((c): c is NonNullable<typeof c> => !!c);
  const suspended = Object.keys(meta)
    .filter((id) => meta[id].suspended)
    .map(getCardById)
    .filter((c): c is NonNullable<typeof c> => !!c);

  const refreshMeta = () => setMeta(loadCardMeta());

  /** Status kecil per kartu favorite: Due / Learning / New / waktu relatif. */
  const favStatus = (cardId: string): string => {
    const p = progress[cardId];
    if (!p) return "New";
    if (isDue(p)) return "Due";
    if (p.state === "learning") return "Learning";
    return formatNextReview(p.dueAt);
  };

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
      {(daily.newCards >= settings.dailyNewLimit ||
        (settings.dailyReviewLimit > 0 && daily.reviewCards >= settings.dailyReviewLimit)) && (
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 8 }}>
          Limit harian tercapai — kartu berikutnya tersedia besok.
        </p>
      )}

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

      <p className="section-label">Study History</p>
      <StudyHistory days={stats.days} />

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

      <hr className="divider" />

      <p className="section-label">Favorites</p>
      {favorites.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Belum ada kartu favorit. Tandai ☆ Favorite pada kartu mana pun.
        </p>
      ) : (
        <div className="meta-card-list">
          {favorites.map((card) => (
            <div className="meta-card-row" key={card.id}>
              <span className="meta-card-char" lang="ja">{card.character}</span>
              <span className="meta-card-sub">
                {cardSubLabel(card)}
                <span className="meta-card-status"> · {favStatus(card.id)}</span>
              </span>
              <button
                type="button"
                className="card-action-btn is-active"
                aria-label={`Hapus ${card.character} dari favorit`}
                aria-pressed="true"
                onClick={() => {
                  toggleFavorite(card.id);
                  refreshMeta();
                }}
              >
                ★
              </button>
            </div>
          ))}
        </div>
      )}

      <hr className="divider" />

      <p className="section-label">Suspended</p>
      {suspended.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Tidak ada kartu yang di-suspend.
        </p>
      ) : (
        <div className="meta-card-list">
          {suspended.map((card) => (
            <div className="meta-card-row" key={card.id}>
              <span className="meta-card-char" lang="ja">{card.character}</span>
              <span className="meta-card-sub">{cardSubLabel(card)}</span>
              <button
                type="button"
                className="card-action-btn"
                aria-label={`Kembalikan ${card.character} ke queue`}
                onClick={() => {
                  setSuspended(card.id, false);
                  refreshMeta();
                }}
              >
                Unsuspend
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
