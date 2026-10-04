import { useState } from "react";
import type { KanaCard } from "../data/kana/index.js";
import type { Rating } from "../srs/types.js";

/**
 * Kartu flashcard: tap untuk reveal (flip), lalu nilai Again/Hard/Good/Easy.
 */
export function Flashcard({
  card,
  index,
  total,
  onRate,
}: {
  card: KanaCard;
  index: number;
  total: number;
  onRate: (rating: Rating) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const reveal = () => setRevealed(true);
  const kicker = `${card.script === "hiragana" ? "Hiragana" : "Katakana"} · ${index + 1} / ${total}`;

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
          <div className="card-face card-back">
            <div className="card-kicker">{kicker}</div>
            <div className="card-char" lang="ja">{card.character}</div>
            {card.romaji ? (
              <div className="card-reading">{card.romaji.toUpperCase()}</div>
            ) : (
              <div className="card-note" lang="id">{card.note}</div>
            )}
            {card.example && (
              <div className="card-example" lang="ja">
                {card.example}
                <span style={{ color: "var(--ink-soft)", fontSize: 15 }}> · {card.exampleReading}</span>
              </div>
            )}
            {card.exampleMeaning && (
              <div className="card-example-meaning">{card.exampleMeaning}</div>
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
