import { useEffect, useRef, useState } from "react";
import type { VocabCard } from "../data/vocab/index.js";
import type { Rating } from "../srs/types.js";
import { AudioButton } from "./AudioButton.js";
import { stopSpeaking } from "../audio/index.js";
import { useJapaneseAudioAvailable } from "../audio/useJapaneseAudio.js";
import type { StudyMode } from "../study/modes.js";
import type { CardSource } from "../queue/index.js";
import { SOURCE_LABELS } from "../queue/index.js";
import { CardActions } from "./CardActions.js";

/**
 * Isi belakang kartu vocabulary: word → reading (+audio) → meanings → examples.
 * Dipakai VocabFlashcard setelah reveal.
 */
export function VocabBack({ card }: { card: VocabCard }) {
  const audioAvailable = useJapaneseAudioAvailable();
  // Reading untuk audio: primaryReading bila ada, fallback ke reading.
  const speakReading = card.primaryReading ?? card.reading;
  return (
    <>
      <div className="card-char card-char-sm" lang="ja">{card.word}</div>

      <div className="kanji-readings" lang="ja">
        <div className="kanji-reading-row">
          <span>{card.reading}</span>
          {audioAvailable && (
            <AudioButton
              size="sm"
              text={speakReading}
              label={`Dengarkan ${card.word}`}
            />
          )}
        </div>
        {card.readings && card.readings.length > 1 && (
          <div className="kanji-reading-row">
            <span className="kanji-reading-tag">ALT</span>
            <span>{card.readings.join("・")}</span>
          </div>
        )}
      </div>

      {!audioAvailable && (
        <p className="audio-note">🔇 Suara Jepang tidak tersedia di perangkat ini.</p>
      )}

      <div className="kanji-meanings">
        {card.meanings.join(" · ")}
      </div>

      {(card.examples?.length ?? 0) > 0 && (
        <div className="kanji-examples">
          {(card.examples ?? []).slice(0, 3).map((ex, i) => (
            <div className="kanji-example-row" key={i}>
              <span lang="ja" className="kanji-example-word">
                {ex.sentence}
                <span className="kanji-example-reading"> {ex.reading}</span>
              </span>
              <span className="kanji-example-meaning">{ex.meaning}</span>
              {audioAvailable && (
                <AudioButton
                  size="sm"
                  text={ex.usedReading ?? ex.sentence}
                  label={`Dengarkan contoh ${i + 1}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Flashcard Vocabulary:
 * - recognition: depan = kata Jepang; belakang = reading + meaning + examples.
 * - recall: depan = arti Indonesia (prompt); belakang = kata Jepang + detail.
 */
export function VocabFlashcard({
  card,
  index,
  total,
  mode = "recognition",
  prompt,
  source,
  onRate,
  previewOnly = false,
}: {
  card: VocabCard;
  index: number;
  total: number;
  mode?: StudyMode;
  prompt?: string;
  source?: CardSource;
  onRate: (rating: Rating) => void;
  /** Preview dari Card Browser: reveal + audio, tanpa rating (bukan bypass SRS). */
  previewOnly?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  /** Guard ref (sinkron) agar rapid double-click hanya dihitung sekali. */
  const ratedRef = useRef(false);

  useEffect(() => {
    ratedRef.current = false;
    return () => stopSpeaking();
  }, []);

  const reveal = () => setRevealed(true);

  const handleRate = (rating: Rating) => {
    if (ratedRef.current) return;
    ratedRef.current = true;
    onRate(rating);
  };
  const kicker = `Vocabulary ${card.level} · ${index + 1} / ${total}`;

  return (
    <div>
      <div className="card-stage">
        <div
          className={`card-inner${revealed ? " revealed" : ""}`}
          onClick={reveal}
          role="button"
          tabIndex={0}
          aria-label={revealed ? "Kartu terbuka" : "Ketuk untuk membuka kartu"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              reveal();
            }
          }}
        >
          <div className="card-face card-front" aria-hidden={revealed}>
            <div className="card-kicker">{kicker}</div>
            {source && <div className="card-source">{SOURCE_LABELS[source]}</div>}
            {mode === "recall" && prompt ? (
              <>
                <div className="card-recall-tag">Recall</div>
                <div className="card-char">{prompt}</div>
              </>
            ) : (
              <div className="card-char" lang="ja">{card.word}</div>
            )}
            {!revealed && <div className="card-hint">Ketuk untuk membuka</div>}
          </div>
          <div className="card-face card-back kanji-back" aria-hidden={!revealed}>
            <div className="card-kicker">{kicker}</div>
            <VocabBack card={card} />
          </div>
        </div>
      </div>

      <CardActions cardId={card.id} />

      {revealed && !previewOnly && (
        <div className="rating-grid" role="group" aria-label="Nilai hafalan">
          <button className="rating-btn again" onClick={() => handleRate("again")}>Again</button>
          <button className="rating-btn hard" onClick={() => handleRate("hard")}>Hard</button>
          <button className="rating-btn good" onClick={() => handleRate("good")}>Good</button>
          <button className="rating-btn easy" onClick={() => handleRate("easy")}>Easy</button>
        </div>
      )}
    </div>
  );
}
