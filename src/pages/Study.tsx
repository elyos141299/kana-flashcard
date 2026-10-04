import { useMemo, useRef, useState } from "react";
import type { KanaCard, KanaScript, KanaSelection } from "../data/kana/index.js";
import { selectKana, GROUP_LABELS, KANA_GROUPS } from "../data/kana/index.js";
import type { KanjiCard, KanjiLevel } from "../data/kanji/index.js";
import { selectKanji } from "../data/kanji/index.js";
import type { VocabCard, VocabLevel } from "../data/vocab/index.js";
import { selectVocab, VOCAB_LEVELS } from "../data/vocab/index.js";
import { Flashcard } from "../components/Flashcard.js";
import { KanjiFlashcard } from "../components/KanjiFlashcard.js";
import { VocabFlashcard } from "../components/VocabFlashcard.js";
import { TypingKanaCard, TypingKanjiCard, TypingVocabCard } from "../components/TypingFlashcard.js";
import type { Rating, CardProgress } from "../srs/types.js";
import { rateCard } from "../srs/scheduler.js";
import { loadProgress, saveProgress, recordReview, recordCardRated, loadSettings, getDailyCounts } from "../storage/progress.js";
import { loadCardMeta } from "../storage/cardMeta.js";
import type { StudyMode } from "../study/modes.js";
import { MODE_LABELS, buildSessionCard } from "../study/modes.js";
import {
  buildMixedPool,
  MIXED_SET_LABELS,
  MIXED_SET_SIZES,
  type MixedSetId,
} from "../study/mixed.js";
import { buildQueue, formatNextReview, classifySource } from "../queue/index.js";
import type { CardSource } from "../queue/index.js";
import { Browse } from "./Browse.js";

type Phase = "setup" | "session" | "done" | "empty" | "browse";
type Category = "hiragana" | "katakana" | "kanji" | "vocabulary";

interface QueueItem {
  card: KanaCard | KanjiCard | VocabCard;
  requeues: number;
  source: CardSource;
  /** Prompt recall (romaji/reading/meaning). Undefined untuk recognition. */
  prompt?: string;
}

const KANA_GROUP_ORDER: KanaSelection[] = [...KANA_GROUPS, "all"];
const KANJI_LEVELS: KanjiLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export function Study() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [category, setCategory] = useState<Category>("hiragana");
  const [kanaGroup, setKanaGroup] = useState<KanaSelection>("basic");
  const [kanjiLevel, setKanjiLevel] = useState<KanjiLevel>("N5");
  const [vocabLevel, setVocabLevel] = useState<VocabLevel>("N5");
  const [count, setCount] = useState<number>(() => loadSettings().defaultCards);
  const [studyMode, setStudyMode] = useState<StudyMode>("recognition");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  /** Study Source: single set (default) atau mixed study. */
  const [sourceMode, setSourceMode] = useState<"single" | "mixed">("single");
  const [mixedSets, setMixedSets] = useState<Set<MixedSetId>>(new Set());
  /** Apakah sesi berjalan sebagai mixed study (untuk label header/summary). */
  const mixedSessionRef = useRef(false);
  const [sessionMode, setSessionMode] = useState<StudyMode>("recognition");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [againCards, setAgainCards] = useState<Set<string>>(new Set());
  const [emptyNextReview, setEmptyNextReview] = useState<string | null>(null);
  /** Breakdown rating sesi ini (tidak disimpan permanen). */
  const [ratingBreakdown, setRatingBreakdown] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  /** Statistik typing sesi ini (tidak disimpan permanen). */
  const [typingStats, setTypingStats] = useState({ correct: 0, wrong: 0 });
  /** Menyimpan apakah sesi kosong berasal dari mode favorites-only. */
  const favoritesOnlyRef = useRef(false);

  const candidatePool: Array<KanaCard | KanjiCard | VocabCard> = useMemo(() => {
    if (sourceMode === "mixed") return buildMixedPool(mixedSets);
    if (category === "kanji") return selectKanji(kanjiLevel);
    if (category === "vocabulary") return selectVocab(vocabLevel);
    return selectKana(category as KanaScript, kanaGroup);
  }, [sourceMode, mixedSets, category, kanaGroup, kanjiLevel, vocabLevel]);

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
        cardMeta: loadCardMeta(),
        favoriteOnly: favoritesOnly,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidatePool, studyMode, count, favoritesOnly],
  );

  /** Pindah ke Mixed Study; pre-select set yang sedang aktif di single mode. */
  const switchToMixed = () => {
    if (sourceMode !== "mixed" && mixedSets.size === 0) {
      const current: MixedSetId =
        category === "kanji" ? kanjiLevel : (category as MixedSetId);
      setMixedSets(new Set([current]));
    }
    setSourceMode("mixed");
  };

  const toggleMixedSet = (id: MixedSetId) => {
    setMixedSets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const start = () => {
    // Smart queue: Learning due → Review due → New (dengan daily limits).
    // Mode dikunci untuk seluruh sesi; prompt recall dihitung sekali di sini.
    const settings = loadSettings();
    favoritesOnlyRef.current = favoritesOnly;
    const result = buildQueue({
      cards: candidatePool,
      progress: loadProgress(),
      mode: studyMode,
      requested: count,
      limits: { dailyNew: settings.dailyNewLimit, dailyReview: settings.dailyReviewLimit },
      daily: getDailyCounts(),
      cardMeta: loadCardMeta(),
      favoriteOnly: favoritesOnly,
    });
    if (result.cards.length === 0) {
      setEmptyNextReview(result.nextReviewAt);
      setPhase("empty");
      return;
    }
    setSessionMode(studyMode);
    mixedSessionRef.current = sourceMode === "mixed";
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
    setTypingStats({ correct: 0, wrong: 0 });
    setPhase("session");
  };

  /**
   * One-card session dari Card Browser ("Study This Card").
   * Kartu tetap memakai SRS normal — tidak reset interval, tidak force due.
   * Eligibility sudah dicek di Browse (due/new, tidak suspended, limit tersedia).
   */
  const startSingleCard = (card: KanaCard | KanjiCard | VocabCard, mode: StudyMode) => {
    const sc = buildSessionCard(card, mode);
    const p = loadProgress()[card.id] ?? null;
    setSessionMode(mode);
    mixedSessionRef.current = false;
    setQueue([{ card, requeues: 0, source: classifySource(p), prompt: sc.prompt }]);
    setTotal(1);
    setDone(0);
    setAgainCards(new Set());
    setRatingBreakdown({ again: 0, hard: 0, good: 0, easy: 0 });
    setTypingStats({ correct: 0, wrong: 0 });
    setPhase("session");
  };

  /** Statistik typing: correctness ≠ rating SRS. Dipanggil sekali per Check. */
  const handleCheck = (correct: boolean) => {
    setTypingStats((prev) =>
      correct ? { ...prev, correct: prev.correct + 1 } : { ...prev, wrong: prev.wrong + 1 },
    );
  };

  const handleRate = (rating: Rating) => {    const [head, ...rest] = queue;
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
        <div className="browse-header">
          <h1 className="page-title" style={{ margin: 0 }}>Study Setup</h1>
          <button type="button" className="link-btn" onClick={() => setPhase("browse")}>
            Browse Cards →
          </button>
        </div>

        <p className="section-label" id="study-source-label">Study Source</p>
        <div className="segmented" role="radiogroup" aria-labelledby="study-source-label">
          {(["single", "mixed"] as const).map((s) => (
            <label key={s} className={`segmented-btn${sourceMode === s ? " is-active" : ""}`}>
              <input
                type="radio"
                name="study-source"
                value={s}
                checked={sourceMode === s}
                onChange={() => (s === "mixed" ? switchToMixed() : setSourceMode("single"))}
                className="sr-only"
              />
              {s === "single" ? "Single Set" : "Mixed Study"}
            </label>
          ))}
        </div>

        {sourceMode === "mixed" ? (
          <>
            <p className="section-label">Kana</p>
            <div className="mixed-checks">
              {(["hiragana", "katakana"] as const).map((id) => (
                <label key={id} className="mixed-check">
                  <input
                    type="checkbox"
                    checked={mixedSets.has(id)}
                    onChange={() => toggleMixedSet(id)}
                  />
                  <span>{MIXED_SET_LABELS[id]} <span className="mixed-count">{MIXED_SET_SIZES[id]}</span></span>
                </label>
              ))}
            </div>
            <p className="section-label">Kanji</p>
            <div className="mixed-checks">
              {(["N5", "N4", "N3", "N2", "N1"] as const).map((id) => (
                <label key={id} className="mixed-check">
                  <input
                    type="checkbox"
                    checked={mixedSets.has(id)}
                    onChange={() => toggleMixedSet(id)}
                  />
                  <span>{MIXED_SET_LABELS[id]} <span className="mixed-count">{MIXED_SET_SIZES[id]}</span></span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
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
          <button className="choice" aria-pressed={category === "vocabulary"} onClick={() => setCategory("vocabulary")}>
            語 Vocabulary
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
        ) : category === "vocabulary" ? (
          <>
            <p className="section-label">Vocabulary Level</p>
            <div className="choice-grid">
              {VOCAB_LEVELS.map((level) => (
                <button
                  key={level}
                  className="choice"
                  aria-pressed={vocabLevel === level}
                  onClick={() => setVocabLevel(level)}
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
            : studyMode === "recall"
              ? "Lihat bacaan, ingat karakter Jepangnya."
              : "Ketik karakter Jepang dari bacaan yang diberikan."}
        </p>

        <label className="fav-toggle">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
          />
          <span>★ Study favorites only</span>
        </label>

        <button
          className="btn btn-primary"
          onClick={start}
          disabled={sourceMode === "mixed" && mixedSets.size === 0}
        >
          Start Study
        </button>
        {sourceMode === "mixed" && mixedSets.size === 0 && (
          <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 8 }}>
            Select at least one study set.
          </p>
        )}
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
    const anyFavorite = Object.values(loadCardMeta()).some((m) => m.favorite);
    const favOnly = favoritesOnlyRef.current;
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <h1 className="page-title">Study</h1>
        <div className="summary-big" lang="ja">完</div>
        {favOnly && !anyFavorite ? (
          <p style={{ fontSize: 18 }}>No favorite cards yet.</p>
        ) : favOnly ? (
          <>
            <p style={{ fontSize: 18 }}>No favorite cards are due right now.</p>
            <p className="summary-line">
              Your favorite cards will return when they are due.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 18 }}>Semua sudah selesai.</p>
            <p className="summary-line">Tidak ada kartu yang jatuh tempo saat ini.</p>
          </>
        )}
        {emptyNextReview && (
          <p className="summary-line">
            {favOnly ? "Next favorite review" : "Review berikutnya"}: {formatNextReview(emptyNextReview)}
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
        {mixedSessionRef.current && (
          <p className="summary-line">Mixed Study</p>
        )}
        <p style={{ fontSize: 18 }}>{done} kartu selesai direview.</p>
        {breakdownParts.length > 0 && (
          <p className="summary-line">{breakdownParts.join(" · ")}</p>
        )}
        {sessionMode === "typing-recall" && typingStats.correct + typingStats.wrong > 0 && (
          <p className="summary-line">
            Typed correctly {typingStats.correct} · incorrect {typingStats.wrong}
          </p>
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

  if (phase === "browse") {
    return (
      <Browse
        onBack={() => setPhase("setup")}
        onStudyCard={startSingleCard}
      />
    );
  }

  const current = queue[0];
  if (!current) return null;

  const sessionLabel = mixedSessionRef.current
    ? `Mixed Study · ${MODE_LABELS[sessionMode]}`
    : category === "kanji"
      ? `Kanji ${kanjiLevel} · ${MODE_LABELS[sessionMode]}`
      : category === "vocabulary"
        ? `Vocabulary ${vocabLevel} · ${MODE_LABELS[sessionMode]}`
        : `${category === "hiragana" ? "Hiragana" : "Katakana"} · ${MODE_LABELS[sessionMode]}${kanaGroup === "all" ? "" : ` · ${GROUP_LABELS[kanaGroup as keyof typeof GROUP_LABELS]}`}`;

  return (
    <div className="page">
      <div className="session-top">
        <span>{sessionLabel}</span>
        <button className="link-btn" onClick={() => setPhase("setup")}>Akhiri</button>
      </div>
      {current.card.type === "vocabulary" ? (
        sessionMode === "typing-recall" ? (
          <TypingVocabCard
            key={current.card.id + "-" + done}
            card={current.card}
            index={done}
            total={total}
            prompt={current.prompt ?? ""}
            source={current.source}
            onCheck={handleCheck}
            onRate={handleRate}
          />
        ) : (
          <VocabFlashcard
            key={current.card.id + "-" + done}
            card={current.card}
            index={done}
            total={total}
            mode={sessionMode}
            prompt={current.prompt}
            source={current.source}
            onRate={handleRate}
          />
        )
      ) : current.card.type === "kanji" ? (
        sessionMode === "typing-recall" ? (
          <TypingKanjiCard
            key={current.card.id + "-" + done}
            card={current.card}
            index={done}
            total={total}
            prompt={current.prompt ?? ""}
            source={current.source}
            onCheck={handleCheck}
            onRate={handleRate}
          />
        ) : (
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
        )
      ) : sessionMode === "typing-recall" ? (
        <TypingKanaCard
          key={current.card.id + "-" + done}
          card={current.card}
          index={done}
          total={total}
          prompt={current.prompt ?? ""}
          source={current.source}
          onCheck={handleCheck}
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
