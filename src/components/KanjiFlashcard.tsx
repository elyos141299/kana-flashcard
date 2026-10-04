import { useEffect, useRef, useState } from "react";
import type { KanjiCard } from "../data/kanji/index.js";
import type { Rating } from "../srs/types.js";
import { AudioButton } from "./AudioButton.js";
import { getKanjiAudioActions, stopSpeaking } from "../audio/index.js";
import { useJapaneseAudioAvailable } from "../audio/useJapaneseAudio.js";
import type { StudyMode } from "../study/modes.js";
import type { CardSource } from "../queue/index.js";
import { SOURCE_LABELS } from "../queue/index.js";

/**
 * Flashcard Kanji: depan hanya karakter; belakang = reading + meaning + examples.
 * Satu mode: Kanji → Reading + Meaning (§10).
 * - recognition: depan = karakter kanji.
 * - recall: depan = prompt reading, jawaban = karakter kanji.
 */
export function KanjiFlashcard({
  card,
  index,
  total,
  mode = "recognition",
  prompt,
  source,
  onRate,
}: {
  card: KanjiCard;
  index: number;
  total: number;
  mode?: StudyMode;
  prompt?: string;
  source?: CardSource;
  onRate: (rating: Rating) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const audioAvailable = useJapaneseAudioAvailable();
  const audioActions = getKanjiAudioActions(card);
  const audioById = (id: string) => audioActions.find((a) => a.id === id);
  /** Guard ref (sinkron) agar rapid double-click hanya dihitung sekali. */
  const ratedRef = useRef(false);

  // Hentikan speech saat pindah kartu / keluar sesi (komponen unmount tiap kartu).
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
  const kicker = `Kanji ${card.level} · ${index + 1} / ${total}`;

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
          <div className="card-face card-front">
            <div className="card-kicker">{kicker}</div>
            {source && <div className="card-source">{SOURCE_LABELS[source]}</div>}
            {mode === "recall" && prompt ? (
              <>
                <div className="card-recall-tag">Recall</div>
                <div className="card-char" lang="ja">{prompt}</div>
              </>
            ) : (
              <div className="card-char" lang="ja">{card.character}</div>
            )}
            {!revealed && <div className="card-hint">Ketuk untuk membuka</div>}
          </div>
          <div className="card-face card-back kanji-back">
            <div className="card-kicker">{kicker}</div>
            <div className="card-char card-char-sm" lang="ja">{card.character}</div>

            {(card.onyomi.length > 0 || card.kunyomi.length > 0) && (
              <div className="kanji-readings" lang="ja">
                {card.onyomi.length > 0 && (
                  <div className="kanji-reading-row">
                    <span className="kanji-reading-tag">ON</span>
                    <span>{card.onyomi.join("・")}</span>
                    {audioAvailable && audioById("on") && (
                      <AudioButton
                        size="sm"
                        text={audioById("on")!.text}
                        label={audioById("on")!.label}
                      />
                    )}
                  </div>
                )}
                {card.kunyomi.length > 0 && (
                  <div className="kanji-reading-row">
                    <span className="kanji-reading-tag">KUN</span>
                    <span>{card.kunyomi.join("・")}</span>
                    {audioAvailable && audioById("kun") && (
                      <AudioButton
                        size="sm"
                        text={audioById("kun")!.text}
                        label={audioById("kun")!.label}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {!audioAvailable && (
              <p className="audio-note">🔇 Suara Jepang tidak tersedia di perangkat ini.</p>
            )}

            <div className="kanji-meanings">
              {card.meanings.join(" · ")}
            </div>

            {card.examples.length > 0 && (
              <div className="kanji-examples">
                {card.examples.slice(0, 3).map((ex, i) => {
                  const action = audioById(`ex-${i}`);
                  return (
                    <div className="kanji-example-row" key={i}>
                      <span lang="ja" className="kanji-example-word">
                        {ex.word}
                        <span className="kanji-example-reading"> {ex.reading}</span>
                      </span>
                      <span className="kanji-example-meaning">{ex.meaning}</span>
                      {audioAvailable && action && (
                        <AudioButton size="sm" text={action.text} label={action.label} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {revealed && (
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
