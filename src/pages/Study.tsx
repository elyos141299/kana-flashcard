import { useState } from "react";
import type { KanaCard, KanaScript, KanaSelection } from "../data/kana/index.js";
import { selectKana, GROUP_LABELS, KANA_GROUPS } from "../data/kana/index.js";
import type { KanjiCard, KanjiLevel } from "../data/kanji/index.js";
import { selectKanji, countKanji } from "../data/kanji/index.js";
import { Flashcard } from "../components/Flashcard.js";
import { KanjiFlashcard } from "../components/KanjiFlashcard.js";
import type { Rating, CardProgress } from "../srs/types.js";
import { rateCard } from "../srs/scheduler.js";
import { loadProgress, saveProgress, recordReview, loadSettings } from "../storage/progress.js";

type Phase = "setup" | "session" | "done";
type Category = "hiragana" | "katakana" | "kanji";

interface QueueItem {
  card: KanaCard | KanjiCard;
  requeues: number;
}

const KANA_GROUP_ORDER: KanaSelection[] = [...KANA_GROUPS, "all"];
const KANJI_LEVELS: KanjiLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function Study() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState<Category>("hiragana");
  const [kanaGroup, setKanaGroup] = useState<KanaSelection>("basic");
  const [kanjiLevel, setKanjiLevel] = useState<KanjiLevel>("N5");
  const [count, setCount] = useState<number>(() => loadSettings().defaultCards);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const availableCount =
    category === "kanji"
      ? countKanji(kanjiLevel)
      : selectKana(category as KanaScript, kanaGroup).length;

  const start = () => {
    // Urutan deterministic sesuai dataset; SRS yang sama untuk kana & kanji
    const cards: Array<KanaCard | KanjiCard> =
      category === "kanji"
        ? selectKanji(kanjiLevel).slice(0, count)
        : selectKana(category as KanaScript, kanaGroup).slice(0, count);
    setQueue(cards.map((card) => ({ card, requeues: 0 })));
    setTotal(cards.length);
    setDone(0);
    setPhase("session");
  };

  const handleRate = (rating: Rating) => {
    const [head, ...rest] = queue;
    if (!head) return;

    // SRS engine menghitung jadwal; UI hanya meneruskan rating
    const store = loadProgress();
    const next: CardProgress = rateCard(store[head.card.id] ?? null, head.card.id, rating);
    store[head.card.id] = next;
    saveProgress(store);
    recordReview(rating);

    // Again: kartu masuk lagi di akhir antrian (maks 2x per sesi, §14)
    let newQueue = rest;
    if (rating === "again" && head.requeues < 2) {
      newQueue = [...rest, { card: head.card, requeues: head.requeues + 1 }];
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

        <button className="btn btn-primary" onClick={start}>Start</button>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 14 }}>
          {Math.min(count, availableCount)} dari {availableCount} kartu tersedia.
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <h1 className="page-title">Session Complete</h1>
        <div className="summary-big" lang="ja">終</div>
        <p style={{ fontSize: 18 }}>{done} kartu selesai direview.</p>
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
      ? `Kanji · ${kanjiLevel}`
      : `${category === "hiragana" ? "Hiragana" : "Katakana"} · ${
          kanaGroup === "all" ? "All Kana" : GROUP_LABELS[kanaGroup as keyof typeof GROUP_LABELS]
        }`;

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
          onRate={handleRate}
        />
      ) : (
        <Flashcard
          key={current.card.id + "-" + done}
          card={current.card}
          index={done}
          total={total}
          onRate={handleRate}
        />
      )}
    </div>
  );
}
