import { useState } from "react";
import type { KanjiCard } from "../data/kanji/index.js";
import type { Rating } from "../srs/types.js";

/**
 * Flashcard Kanji: depan hanya karakter; belakang = reading + meaning + examples.
 * Satu mode: Kanji → Reading + Meaning (§10).
 */
export function KanjiFlashcard({
  card,
  index,
  total,
  onRate,
}: {
  card: KanjiCard;
  index: number;
  total: number;
  onRate: (rating: Rating) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const reveal = () => setRevealed(true);
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
            <div className="card-char" lang="ja">{card.character}</div>
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
                  </div>
                )}
                {card.kunyomi.length > 0 && (
                  <div className="kanji-reading-row">
                    <span className="kanji-reading-tag">KUN</span>
                    <span>{card.kunyomi.join("・")}</span>
                  </div>
                )}
              </div>
            )}

            <div className="kanji-meanings">
              {card.meanings.join(" · ")}
            </div>

            {card.examples.length > 0 && (
              <div className="kanji-examples">
                {card.examples.slice(0, 3).map((ex, i) => (
                  <div className="kanji-example-row" key={i}>
                    <span lang="ja" className="kanji-example-word">
                      {ex.word}
                      <span className="kanji-example-reading"> {ex.reading}</span>
                    </span>
                    <span className="kanji-example-meaning">{ex.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {revealed && (
        <div className="rating-grid" role="group" aria-label="Nilai hafalan">
          <button className="rating-btn again" onClick={() => onRate("again")}>Again</button>
          <button className="rating-btn hard" onClick={() => onRate("hard")}>Hard</button>
          <button className="rating-btn good" onClick={() => onRate("good")}>Good</button>
          <button className="rating-btn easy" onClick={() => onRate("easy")}>Easy</button>
        </div>
      )}
    </div>
  );
}
