import { useEffect, useMemo, useState } from "react";
import { HIRAGANA_ALL, KATAKANA_ALL } from "../data/kana/index.js";
import type { KanaCard } from "../data/kana/index.js";
import {
  KANJI_N5, KANJI_N4, KANJI_N3, KANJI_N2, KANJI_N1,
} from "../data/kanji/index.js";
import type { KanjiCard } from "../data/kanji/index.js";
import { VOCAB_N5 } from "../data/vocab/index.js";
import { loadProgress, loadSettings, getDailyCounts } from "../storage/progress.js";
import { loadCardMeta } from "../storage/cardMeta.js";
import { classifySource } from "../queue/classify.js";
import { isDue } from "../srs/types.js";
import { formatNextReview } from "../queue/index.js";
import { cardSubLabel } from "../data/cards.js";
import { AudioButton } from "../components/AudioButton.js";
import { getKanaAudioActions, getKanjiAudioActions } from "../audio/index.js";
import { useJapaneseAudioAvailable } from "../audio/useJapaneseAudio.js";
import { CardActions } from "../components/CardActions.js";
import { Flashcard } from "../components/Flashcard.js";
import { KanjiFlashcard } from "../components/KanjiFlashcard.js";
import { VocabFlashcard } from "../components/VocabFlashcard.js";
import type { StudyMode } from "../study/modes.js";
import { MODE_LABELS } from "../study/modes.js";
import {
  DEFAULT_FILTERS,
  filterCards,
  searchCards,
  studyEligibility,
  type AnyCard,
  type BrowserFilters,
  type StatusFilter,
} from "../browse/search.js";

const PAGE_SIZE = 20;
const KANJI_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const STATUS_FILTERS: StatusFilter[] = [
  "all", "favorite", "suspended", "due", "new", "learning", "review",
];
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All", favorite: "Favorite", suspended: "Suspended", due: "Due",
  new: "New", learning: "Learning", review: "Review",
};

function allCards(): AnyCard[] {
  return [
    ...HIRAGANA_ALL,
    ...KATAKANA_ALL,
    ...KANJI_N5, ...KANJI_N4, ...KANJI_N3, ...KANJI_N2, ...KANJI_N1,
    ...VOCAB_N5,
  ];
}

/** Karakter utama untuk display. */
function displayChar(card: AnyCard): string {
  return card.type === "vocabulary" ? card.word : card.character;
}

/** Badge status kecil: New / Learning / Review / Due / Suspended. */
function StatusBadge({ card, progress, suspended }: {
  card: AnyCard;
  progress: ReturnType<typeof loadProgress>;
  suspended: boolean;
}) {
  const p = progress[card.id] ?? null;
  const source = classifySource(p);
  const parts: string[] = [];
  if (suspended) parts.push("Suspended");
  parts.push(source === "new" ? "New" : source === "learning" ? "Learning" : "Review");
  if (p && source !== "new" && isDue(p)) parts.push("Due");
  return <span className="browse-status">{parts.join(" · ")}</span>;
}

function KanaDetailAudio({ card }: { card: KanaCard }) {
  const available = useJapaneseAudioAvailable();
  const [action] = getKanaAudioActions(card);
  if (!available) return <p className="audio-note">🔇 Suara tidak tersedia.</p>;
  return <AudioButton text={action.text} label={action.label} />;
}

function KanjiDetailAudio({ card }: { card: KanjiCard }) {
  const available = useJapaneseAudioAvailable();
  const actions = getKanjiAudioActions(card);
  const byId = (id: string) => actions.find((a) => a.id === id);
  if (!available) return <p className="audio-note">🔇 Suara tidak tersedia.</p>;
  return (
    <div className="browse-audio-rows">
      {card.onyomi.length > 0 && byId("on") && (
        <div className="kanji-reading-row">
          <span className="kanji-reading-tag">ON</span>
          <span lang="ja">{card.onyomi.join("・")}</span>
          <AudioButton size="sm" text={byId("on")!.text} label={byId("on")!.label} />
        </div>
      )}
      {card.kunyomi.length > 0 && byId("kun") && (
        <div className="kanji-reading-row">
          <span className="kanji-reading-tag">KUN</span>
          <span lang="ja">{card.kunyomi.join("・")}</span>
          <AudioButton size="sm" text={byId("kun")!.text} label={byId("kun")!.label} />
        </div>
      )}
    </div>
  );
}

function VocabDetailAudio({ card }: { card: { word: string; reading: string; primaryReading?: string } }) {
  const available = useJapaneseAudioAvailable();
  if (!available) return <p className="audio-note">🔇 Suara tidak tersedia.</p>;
  const speakText = card.primaryReading ?? card.reading;
  return (
    <div className="browse-audio-rows">
      <div className="kanji-reading-row">
        <span lang="ja">{card.reading}</span>
        <AudioButton size="sm" text={speakText} label={`Dengarkan ${card.word}`} />
      </div>
    </div>
  );
}

export function Browse({
  onStudyCard,
  onBack,
}: {
  /** Mulai one-card session (hanya untuk kartu eligible). */
  onStudyCard: (card: AnyCard, mode: StudyMode) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<BrowserFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [detailMode, setDetailMode] = useState<StudyMode>("recognition");
  const [meta, setMeta] = useState(loadCardMeta);

  const cards = useMemo(() => allCards(), []);
  const progress = useMemo(() => loadProgress(), []);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  /** Waktu referensi stabil per mount untuk status due. */
  const [now] = useState(() => new Date());

  const filtered = useMemo(() => {
    return filterCards(searchCards(cards, query), filters, progress, meta, now);
  }, [cards, query, filters, progress, meta, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageCards = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const setF = (patch: Partial<BrowserFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
    setSelectedId(null);
    setShowingPreview(false);
  };

  const onQueryChange = (v: string) => {
    setQuery(v);
    setPage(0);
    setSelectedId(null);
    setShowingPreview(false);
  };

  const selected = selectedId ? byId.get(selectedId) ?? null : null;

  const detail = selected ? (
    <CardDetail
      card={selected}
      progress={progress}
      suspended={!!meta[selected.id]?.suspended}
      detailMode={detailMode}
      setDetailMode={setDetailMode}
      showingPreview={showingPreview}
      setShowingPreview={setShowingPreview}
      onStudyCard={onStudyCard}
      onBackToList={() => {
        setSelectedId(null);
        setShowingPreview(false);
      }}
      onMetaChange={() => setMeta(loadCardMeta())}
    />
  ) : null;

  return (
    <div className="page">
      <div className="browse-header">
        <button type="button" className="link-btn" onClick={onBack} aria-label="Kembali ke Study">
          ← Back
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>Browse Cards</h1>
      </div>

      {selected ? (
        detail
      ) : (
        <>
          <label className="browse-search-label" htmlFor="browse-search">
            Search cards
          </label>
          <input
            id="browse-search"
            className="browse-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ね · NE · 学 · がく"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          <div className="browse-filters">
            <div className="segmented" role="radiogroup" aria-label="Dataset">
              {(["all", "kana", "kanji", "vocabulary"] as const).map((d) => (
                <label key={d} className={`segmented-btn${filters.dataset === d ? " is-active" : ""}`}>
                  <input
                    type="radio" name="browse-dataset" className="sr-only"
                    checked={filters.dataset === d}
                    onChange={() => setF({ dataset: d })}
                  />
                  {d === "all" ? "All" : d === "kana" ? "Kana" : d === "kanji" ? "Kanji" : "Vocab"}
                </label>
              ))}
            </div>

            {filters.dataset === "kana" && (
              <div className="segmented" role="radiogroup" aria-label="Script">
                {(["hiragana", "katakana"] as const).map((s) => (
                  <label key={s} className={`segmented-btn${filters.script === s ? " is-active" : ""}`}>
                    <input
                      type="radio" name="browse-script" className="sr-only"
                      checked={filters.script === s}
                      onChange={() => setF({ script: s })}
                    />
                    {s === "hiragana" ? "Hiragana" : "Katakana"}
                  </label>
                ))}
              </div>
            )}

            {filters.dataset === "kanji" && (
              <div className="segmented" role="radiogroup" aria-label="Level">
                {(["all", ...KANJI_LEVELS] as const).map((l) => (
                  <label key={l} className={`segmented-btn${filters.level === l ? " is-active" : ""}`}>
                    <input
                      type="radio" name="browse-level" className="sr-only"
                      checked={filters.level === l}
                      onChange={() => setF({ level: l })}
                    />
                    {l === "all" ? "All" : l}
                  </label>
                ))}
              </div>
            )}

            <div className="browse-chips" role="radiogroup" aria-label="Status">
              {STATUS_FILTERS.map((s) => (
                <label key={s} className={`browse-chip${filters.status === s ? " is-active" : ""}`}>
                  <input
                    type="radio" name="browse-status" className="sr-only"
                    checked={filters.status === s}
                    onChange={() => setF({ status: s })}
                  />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </div>

          <p className="browse-count" aria-live="polite">
            {filtered.length === 0
              ? "No cards found."
              : `${filtered.length} card${filtered.length === 1 ? "" : "s"}`}
          </p>

          {filtered.length > 0 && (
            <>
              <ul className="browse-list">
                {pageCards.map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      className="browse-row"
                      onClick={() => setSelectedId(card.id)}
                      aria-label={`${displayChar(card)}, ${cardSubLabel(card)}`}
                    >
                      <span className="browse-row-char" lang="ja">{displayChar(card)}</span>
                      <span className="browse-row-main">
                        <span className="browse-row-sub">{cardSubLabel(card)}</span>
                        <StatusBadge
                          card={card}
                          progress={progress}
                          suspended={!!meta[card.id]?.suspended}
                        />
                      </span>
                      <span className="browse-row-fav" aria-hidden="true">
                        {meta[card.id]?.favorite ? "★" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="browse-pagination">
                  <button
                    type="button" className="btn"
                    disabled={safePage === 0}
                    onClick={() => setPage(safePage - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="browse-page-info">
                    {safePage + 1} / {totalPages}
                  </span>
                  <button
                    type="button" className="btn"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage(safePage + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function CardDetail({
  card,
  progress,
  suspended,
  detailMode,
  setDetailMode,
  showingPreview,
  setShowingPreview,
  onStudyCard,
  onBackToList,
  onMetaChange,
}: {
  card: AnyCard;
  progress: ReturnType<typeof loadProgress>;
  suspended: boolean;
  detailMode: StudyMode;
  setDetailMode: (m: StudyMode) => void;
  showingPreview: boolean;
  setShowingPreview: (v: boolean) => void;
  onStudyCard: (card: AnyCard, mode: StudyMode) => void;
  onBackToList: () => void;
  onMetaChange: () => void;
}) {
  const settings = useMemo(() => loadSettings(), []);
  const daily = useMemo(() => getDailyCounts(), []);
  const eligibility = useMemo(
    () =>
      studyEligibility(card, progress, loadCardMeta(), daily, {
        dailyNew: settings.dailyNewLimit,
        dailyReview: settings.dailyReviewLimit,
      }),
    [card, progress, daily, settings],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showingPreview) setShowingPreview(false);
        else onBackToList();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showingPreview, onBackToList, setShowingPreview]);

  if (showingPreview) {
    return (
      <div>
        <button type="button" className="link-btn" onClick={() => setShowingPreview(false)}>
          ← Back to detail
        </button>
        <p className="browse-preview-note">
          Preview only — rating dinonaktifkan agar tidak mem-bypass SRS.
        </p>
        {card.type === "kanji" ? (
          <KanjiFlashcard card={card} index={0} total={1} previewOnly onRate={() => {}} />
        ) : card.type === "vocabulary" ? (
          <VocabFlashcard card={card} index={0} total={1} previewOnly onRate={() => {}} />
        ) : (
          <Flashcard card={card} index={0} total={1} previewOnly onRate={() => {}} />
        )}
      </div>
    );
  }

  const p = progress[card.id] ?? null;
  const source = classifySource(p);

  return (
    <div
      className="browse-detail"
      onKeyDown={(e) => {
        if (e.key === "Escape") onBackToList();
      }}
    >
      <button type="button" className="link-btn" onClick={onBackToList}>
        ← Back to list
      </button>

      <div className="browse-detail-char" lang="ja">{displayChar(card)}</div>
      <div className="browse-detail-sub">{cardSubLabel(card)}</div>
      <div className="browse-detail-status">
        <StatusBadge card={card} progress={progress} suspended={suspended} />
        {p && source !== "new" && !isDue(p) && (
          <span className="browse-status"> · {formatNextReview(p.dueAt)}</span>
        )}
      </div>

      {card.type === "kana" ? (
        <>
          <div className="browse-detail-audio">
            <KanaDetailAudio card={card} />
          </div>
          {card.example && (
            <p className="browse-detail-example" lang="ja">
              {card.example}
              <span className="browse-detail-example-sub"> · {card.exampleReading}</span>
            </p>
          )}
        </>
      ) : card.type === "kanji" ? (
        <>
          <div className="browse-detail-meanings">{card.meanings.join(" · ")}</div>
          <div className="browse-detail-audio">
            <KanjiDetailAudio card={card} />
          </div>
        </>
      ) : (
        <>
          <div className="browse-detail-meanings">{card.meanings.join(" · ")}</div>
          <div className="browse-detail-audio">
            <VocabDetailAudio card={card} />
          </div>
        </>
      )}

      <div onClick={onMetaChange}>
        <CardActions cardId={card.id} />
      </div>

      <div className="browse-study-box">
        {eligibility.kind === "blocked-suspended" ? (
          <p className="browse-note">
            Card ini suspended. Unsuspend dulu untuk mempelajarinya.
          </p>
        ) : eligibility.kind === "blocked-limit" ? (
          <p className="browse-note">
            {eligibility.reason === "new"
              ? "Daily new limit habis — kartu tersedia besok."
              : "Daily review limit habis — kartu tersedia besok."}
          </p>
        ) : eligibility.kind === "preview" ? (
          <>
            <p className="browse-note">
              Card belum due — preview saja, tanpa rating SRS.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowingPreview(true)}
            >
              Preview Card
            </button>
          </>
        ) : (
          <>
            <p className="section-label">Study mode</p>
            <div className="segmented" role="radiogroup" aria-label="Study mode">
              {(Object.keys(MODE_LABELS) as StudyMode[]).map((m) => (
                <label key={m} className={`segmented-btn${detailMode === m ? " is-active" : ""}`}>
                  <input
                    type="radio" name="browse-mode" className="sr-only"
                    checked={detailMode === m}
                    onChange={() => setDetailMode(m)}
                  />
                  {MODE_LABELS[m]}
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onStudyCard(card, detailMode)}
            >
              Study This Card
            </button>
          </>
        )}
      </div>
    </div>
  );
}
