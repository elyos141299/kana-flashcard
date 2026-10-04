import { useEffect, useRef, useState } from "react";
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";
import type { Rating } from "../srs/types.js";
import { stopSpeaking } from "../audio/index.js";
import { checkTypingAnswer, type TypingCheckResult } from "../study/typing.js";
import type { CardSource } from "../queue/index.js";
import { SOURCE_LABELS } from "../queue/index.js";
import { KanaBack } from "./Flashcard.js";
import { KanjiBack } from "./KanjiFlashcard.js";

/**
 * Typing Recall (Phase 15): user mengetik jawaban sebelum melihat hasil.
 *
 * Flow: Prompt → Input → Check → Result → (reveal otomatis) → Rating.
 * - Satu cardId = satu progress, sama seperti mode lain.
 * - Correctness ≠ rating SRS: user tetap menilai manual Again/Hard/Good/Easy.
 * - Audio hanya muncul setelah Check (tidak membocorkan jawaban).
 */

interface TypingShellProps {
  kicker: string;
  source?: CardSource;
  /** Prompt besar (romaji / reading / SMALL TSU). */
  prompt: string;
  /** Sub-prompt: indikator script atau instruksi. */
  promptSub: string;
  promptLangJa: boolean;
  inputAriaLabel: string;
  expectedAnswer: string;
  /** Romaji alternatif — HANYA untuk kana. */
  altRomaji?: string;
  onCheck: (correct: boolean) => void;
  onRate: (rating: Rating) => void;
  /** Konten reveal setelah Check (KanaBack / KanjiBack). */
  back: React.ReactNode;
}

function TypingShell({
  kicker,
  source,
  prompt,
  promptSub,
  promptLangJa,
  inputAriaLabel,
  expectedAnswer,
  altRomaji,
  onCheck,
  onRate,
  back,
}: TypingShellProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<TypingCheckResult | null>(null);
  /** Guard sinkron: rapid submit Check hanya dihitung sekali. */
  const checkRef = useRef(false);
  const ratedRef = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  const doCheck = () => {
    if (checkRef.current || !answer.trim()) return;
    checkRef.current = true;
    const r = checkTypingAnswer(answer, expectedAnswer, altRomaji);
    setResult(r);
    onCheck(r.correct);
  };

  const handleRate = (rating: Rating) => {
    if (ratedRef.current) return;
    ratedRef.current = true;
    onRate(rating);
  };

  return (
    <div>
      <div className="card-stage">
        <div className="typing-card">
          <div className="card-kicker">{kicker}</div>
          {source && <div className="card-source">{SOURCE_LABELS[source]}</div>}
          <div className="card-recall-tag">Typing Recall</div>
          <div className="card-char" lang={promptLangJa ? "ja" : undefined}>
            {prompt}
          </div>
          <div className="typing-sub">{promptSub}</div>
          <form
            className="typing-form"
            onSubmit={(e) => {
              e.preventDefault();
              doCheck();
            }}
          >
            <input
              className="typing-input"
              lang="ja"
              value={answer}
              disabled={!!result}
              aria-label={inputAriaLabel}
              placeholder="…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => setAnswer(e.target.value)}
            />
            {!result && (
              <button
                type="submit"
                className="btn btn-primary typing-check"
                disabled={!answer.trim()}
              >
                Check
              </button>
            )}
          </form>
        </div>
      </div>

      {result && (
        <div>
          <div
            className={`typing-result${result.correct ? " correct" : " incorrect"}`}
            role="status"
            aria-live="polite"
          >
            {result.correct ? "✓ Correct" : "✕ Not quite"}
          </div>
          <div className="typing-compare">
            <div className="typing-compare-row">
              <span className="typing-compare-label">Your answer</span>
              <span className="typing-compare-value" lang="ja">
                {result.userAnswer}
              </span>
            </div>
            <div className="typing-compare-row">
              <span className="typing-compare-label">Correct</span>
              <span className="typing-compare-value" lang="ja">
                {result.expectedAnswer}
              </span>
            </div>
          </div>
          <div className="typing-back">{back}</div>
          <div className="rating-grid" role="group" aria-label="Nilai hafalan">
            <button type="button" className="rating-btn again" onClick={() => handleRate("again")}>Again</button>
            <button type="button" className="rating-btn hard" onClick={() => handleRate("hard")}>Hard</button>
            <button type="button" className="rating-btn good" onClick={() => handleRate("good")}>Good</button>
            <button type="button" className="rating-btn easy" onClick={() => handleRate("easy")}>Easy</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TypingKanaCard({
  card,
  index,
  total,
  prompt,
  source,
  onCheck,
  onRate,
}: {
  card: KanaCard;
  index: number;
  total: number;
  prompt: string;
  source?: CardSource;
  onCheck: (correct: boolean) => void;
  onRate: (rating: Rating) => void;
}) {
  const scriptLabel = card.script === "hiragana" ? "Hiragana" : "Katakana";
  return (
    <TypingShell
      kicker={`${scriptLabel} · ${index + 1} / ${total}`}
      source={source}
      prompt={prompt}
      promptSub={`Type it in ${scriptLabel}`}
      promptLangJa={false}
      inputAriaLabel={`Ketik jawaban ${scriptLabel.toLowerCase()}`}
      expectedAnswer={card.character}
      altRomaji={card.romaji || undefined}
      onCheck={onCheck}
      onRate={onRate}
      back={<KanaBack card={card} />}
    />
  );
}

export function TypingKanjiCard({
  card,
  index,
  total,
  prompt,
  source,
  onCheck,
  onRate,
}: {
  card: KanjiCard;
  index: number;
  total: number;
  prompt: string;
  source?: CardSource;
  onCheck: (correct: boolean) => void;
  onRate: (rating: Rating) => void;
}) {
  return (
    <TypingShell
      kicker={`Kanji ${card.level} · ${index + 1} / ${total}`}
      source={source}
      prompt={prompt}
      promptSub="Type the kanji"
      promptLangJa
      inputAriaLabel="Ketik kanji yang dimaksud"
      expectedAnswer={card.character}
      onCheck={onCheck}
      onRate={onRate}
      back={<KanjiBack card={card} />}
    />
  );
}
