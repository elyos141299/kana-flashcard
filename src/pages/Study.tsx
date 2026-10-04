import { useMemo, useState } from "react";
import type { KanaCard, KanaScript, KanaSelection } from "../data/kana/index.js";
import { selectKana, GROUP_LABELS, KANA_GROUPS } from "../data/kana/index.js";
import type { KanjiCard, KanjiLevel } from "../data/kanji/index.js";
import { selectKanji } from "../data/kanji/index.js";
import { Flashcard } from "../components/Flashcard.js";
import { KanjiFlashcard } from "../components/KanjiFlashcard.js";
import type { Rating, CardProgress } from "../srs/types.js";
import { rateCard } from "../srs/scheduler.js";
import { loadProgress, saveProgress, recordReview, recordCardRated, loadSettings, getDailyCounts } from "../storage/progress.js";
import type { StudyMode } from "../study/modes.js";
import { MODE_LABELS } from "../study/modes.js";
import { buildQueue, formatNextReview, classifySource } from "../queue/index.js";
import type { CardSource } from "../queue/index.js";

type Phase = "setup" | "session" | "done" | "empty";
type Category = "hiragana" | "katakana" | "kanji";

interface QueueItem {
  card: KanaCard | KanjiCard;
  requeues: number;
  source: CardSource;
  /** Prompt recall (romaji/reading). Undefined untuk recognition. */
  prompt?: string;
}

const KANA_GROUP_ORDER: KanaSelection[] = [...KANA_GROUPS, "all"];
const KANJI_LEVELS: KanjiLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function Study() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState<Category>("hiragana");
  const [kanaGroup, setKanaGroup] = useState<KanaSelection>("basic");
  const [kanjiLevel, setKanjiLevel] = useState<KanjiLevel>("N5");
  const [count, setCount] = useState<number>(() => loadSettings().defaultCards);
  const [studyMode, setStudyMode] = useState<StudyMode>("recognition");
  const [sessionMode, setSessionMode] = useState<StudyMode>("recognition");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [againCards, setAgainCards] = useState<Set<string>>(new Set());
  const [emptyNextReview, setEmptyNextReview] = useState<string | null>(null);
  /** Breakdown rating sesi ini (tidak disimpan permanen). */
  const [ratingBreakdown, setRatingBreakdown] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  const candidatePool: Array<KanaCard | KanjiCard> =
    category === "kanji"
      ? selectKanji(kanjiLevel)
      : selectKana(category as KanaScript, kanaGroup);

  /** Preview queue untuk setup — dihitung ulang hanya saat input setup berubah. */
  const queuePreview = useMemo(
    () =>
      buildQueue({
        cards: candidatePool,
        progress: loadProgress(),
        mode: studyMode,
        requested: count,
        limits: (() => {
          const s = loadSettings();
          return { dailyNew: s.dailyNewLimit, dailyReview: s.dailyReviewLimit };
        })(),
        daily: getDailyCounts(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, kanaGroup, kanjiLevel, studyMode, count],
  );

  const start = () => {
    // Smart queue: Learning due → Review due → New (dengan daily limits).
    // Mode dikunci untuk seluruh sesi; prompt recall dihitung sekali di sini.
    const settings = loadSettings();
    const result = buildQueue({
      cards: candidatePool,
      progress: loadProgress(),
      mode: studyMode,
      requested: count,
      limits: { dailyNew: settings.dailyNewLimit, dailyReview: settings.dailyReviewLimit },
      daily: getDailyCounts(),
    });
    if (result.cards.length === 0) {
      setEmptyNextReview(result.nextReviewAt);
      setPhase("empty");
      return;
    }
    setSessionMode(studyMode);
    setQueue(
      result.cards.map((qc) => ({
        card: qc.card,
        requeues: 0,
        source: qc.source,
        prompt: qc.prompt,
      })),
    );
    setTotal(result.cards.length);
    setDone(0);
    setAgainCards(new Set());
    setRatingBreakdown({ again: 0, hard: 0, good: 0, easy: 0 });
    setPhase("session");
  };

  const handleRate = (rating: Rating) => {
    const [head, ...rest] = queue;
    if (!head) return;

    // SRS engine menghitung jadwal; UI hanya meneruskan rating.
    // Satu cardId = satu progress, apa pun modenya.
    const store = loadProgress();
    const next: CardProgress = rateCard(store[head.card.id] ?? null, head.card.id, rating);
    store[head.card.id] = next;
    saveProgress(store);
    recordReview(rating);
    // Counter harian berdasarkan kategori saat dinilai (bukan saat masuk queue).
    recordCardRated(head.source);
    setRatingBreakdown((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    if (rating === "again") {
      setAgainCards((prev) => new Set(prev).add(head.card.id));
    }

    // Again: kartu masuk lagi di akhir antrian (maks 2x per sesi, §14).
    // Prompt recall ikut terbawa agar konsisten.
    // §20: setelah rating, kartu diperlakukan sebagai LEARNING.
    let newQueue = rest;
    if (rating === "again" && head.requeues < 2) {
      newQueue = [
        ...rest,
        { card: head.card, requeues: head.requeues + 1, prompt: head.prompt, source: classifySource(next) },
      ];
    }

    const newDone = done + 1;
    setDone(newDone);
    if (newQueue.length === 0) {
      setPhase("done");
    } else {
      setQueue(newQueue);
    }
  };

  if (phase === "setup") {
    return (
      <div className="page">
        <h1 className="page-title">Study Setup</h1>

        <p className="section-label">Category</p>
        <div className="choice-grid">
          <button className="choice" aria-pressed={category === "hiragana"} onClick={() => setCategory("hiragana")}>
            あ Hiragana
          </button>
          <button className="choice" aria-pressed={category === "katakana"} onClick={() => setCategory("katakana")}>
            ア Katakana
          </button>
          <button className="choice" aria-pressed={category === "kanji"} onClick={() => setCategory("kanji")}>
            漢 Kanji
          </button>
        </div>

        {category === "kanji" ? (
          <>
            <p className="section-label">Kanji Level</p>
            <div className="choice-grid">
              {KANJI_LEVELS.map((level) => (
                <button
                  key={level}
                  className="choice"
                  aria-pressed={kanjiLevel === level}
                  onClick={() => setKanjiLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="section-label">Group</p>
            <div className="choice-grid">
              {KANA_GROUP_ORDER.map((g) => (
                <button
                  key={g}
                  className="choice"
                  aria-pressed={kanaGroup === g}
                  onClick={() => setKanaGroup(g)}
                >
                  {g === "all" ? "All Kana" : GROUP_LABELS[g]}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="section-label">Cards</p>
        <div className="choice-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[10, 20, 30, 50].map((n) => (
            <button key={n} className="choice" aria-pressed={count === n} onClick={() => setCount(n)}>
              {n}
            </button>
          ))}
        </div>

        <p className="section-label" id="study-mode-label">Study Mode</p>
        <div className="segmented" role="radiogroup" aria-labelledby="study-mode-label">
          {(Object.keys(MODE_LABELS) as StudyMode[]).map((m) => (
            <label key={m} className={`segmented-btn${studyMode === m ? " is-active" : ""}`}>
              <input
                type="radio"
                name="study-mode"
                value={m}
                checked={studyMode === m}
                onChange={() => setStudyMode(m)}
                className="sr-only"
              />
              {MODE_LABELS[m]}
            </label>
          ))}
        </div>
        <p className="mode-hint">
          {studyMode === "recognition"
            ? "Lihat karakter Jepang, ingat bacaan/artinya."
            : "Lihat bacaan, ingat karakter Jepangnya."}
        </p>

        <button className="btn btn-primary" onClick={start}>Start Study</button>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 14 }}>
          {queuePreview.cards.length === 0
            ? "Tidak ada kartu yang jatuh tempo saat ini."
            : `${queuePreview.cards.length} kartu: ` +
              `${queuePreview.counts.learningDue} learning due · ` +
              `${queuePreview.cards.filter((c) => c.source === "review").length} review · ` +
              `${queuePreview.cards.filter((c) => c.source === "new").length} baru`}
        </p>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <h1 className="page-title">Study</h1>
        <div className="summary-big" lang="ja">完</div>
        <p style={{ fontSize: 18 }}>Semua sudah selesai.</p>
        <p className="summary-line">Tidak ada kartu yang jatuh tempo saat ini.</p>
        {emptyNextReview && (
          <p className="summary-line">
            Review berikutnya: {formatNextReview(emptyNextReview)}
          </p>
        )}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => setPhase("setup")}>Kembali</button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const rb = ratingBreakdown;
    const breakdownParts = [
      rb.good > 0 ? `Good ${rb.good}` : null,
      rb.easy > 0 ? `Easy ${rb.easy}` : null,
      rb.hard > 0 ? `Hard ${rb.hard}` : null,
      rb.again > 0 ? `Again ${rb.again}` : null,
    ].filter(Boolean);
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <h1 className="page-title">Session Complete</h1>
        <div className="summary-big" lang="ja">終</div>
        <p style={{ fontSize: 18 }}>{done} kartu selesai direview.</p>
        {breakdownParts.length > 0 && (
          <p className="summary-line">{breakdownParts.join(" · ")}</p>
        )}
        <p className="summary-line">
          Mode: {MODE_LABELS[sessionMode]}
          {againCards.size > 0 && ` · ${againCards.size} kartu perlu diulang`}
        </p>
        <div className="btn-row">
          <button className="btn" onClick={() => setPhase("setup")}>Kembali</button>
          <button className="btn btn-primary" onClick={start}>Ulangi</button>
        </div>
      </div>
    );
  }

  const current = queue[0];
  if (!current) return null;

  const sessionLabel =
    category === "kanji"
      ? `Kanji ${kanjiLevel} · ${MODE_LABELS[sessionMode]}`
      : `${category === "hiragana" ? "Hiragana" : "Katakana"} · ${MODE_LABELS[sessionMode]}${kanaGroup === "all" ? "" : ` · ${GROUP_LABELS[kanaGroup as keyof typeof GROUP_LABELS]}`}`;

  return (
    <div className="page">
      <div className="session-top">
        <span>{sessionLabel}</span>
        <button className="link-btn" onClick={() => setPhase("setup")}>Akhiri</button>
      </div>
      {current.card.type === "kanji" ? (
        <KanjiFlashcard
          key={current.card.id + "-" + done}
          card={current.card}
          index={done}
          total={total}
          mode={sessionMode}
          prompt={current.prompt}
          source={current.source}
          onRate={handleRate}
        />
      ) : (
        <Flashcard
          key={current.card.id + "-" + done}
          card={current.card}
          index={done}
          total={total}
          mode={sessionMode}
          prompt={current.prompt}
          source={current.source}
          onRate={handleRate}
        />
      )}
    </div>
  );
}
