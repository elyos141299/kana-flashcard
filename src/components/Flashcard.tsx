import { useEffect, useRef, useState } from "react";
import type { KanaCard } from "../data/kana/index.js";
import type { Rating } from "../srs/types.js";
import { AudioButton } from "./AudioButton.js";
import { getKanaAudioActions, stopSpeaking } from "../audio/index.js";
import { useJapaneseAudioAvailable } from "../audio/useJapaneseAudio.js";
import type { StudyMode } from "../study/modes.js";
import type { CardSource } from "../queue/index.js";
import { SOURCE_LABELS } from "../queue/index.js";

/**
 * Isi belakang kartu kana: character → reading → audio → examples.
 * Dipakai Flashcard (setelah reveal) dan TypingKanaCard (setelah Check).
 */
export function KanaBack({ card }: { card: KanaCard }) {
  const audioAvailable = useJapaneseAudioAvailable();
  const [kanaAudio] = getKanaAudioActions(card);
  return (
    <>
      <div className="card-char" lang="ja">{card.character}</div>
      {card.romaji ? (
        <div className="card-reading">{card.romaji.toUpperCase()}</div>
      ) : (
        <div className="card-note" lang="id">{card.note}</div>
      )}
      {audioAvailable ? (
        <AudioButton text={kanaAudio.text} label={kanaAudio.label} />
      ) : (
        <p className="audio-note">🔇 Suara Jepang tidak tersedia di perangkat ini.</p>
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
    </>
  );
}

/**
 * Kartu flashcard: tap untuk reveal (flip), lalu nilai Again/Hard/Good/Easy.
 * - recognition: depan = karakter Jepang.
 * - recall: depan = prompt (romaji), jawaban = karakter Jepang.
 */
export function Flashcard({
  card,
  index,
  total,
  mode = "recognition",
  prompt,
  source,
  onRate,
}: {
  card: KanaCard;
  index: number;
  total: number;
  mode?: StudyMode;
  prompt?: string;
  source?: CardSource;
  onRate: (rating: Rating) => void;
}) {
  const [revealed, setRevealed] = useState(false);
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
            {source && <div className="card-source">{SOURCE_LABELS[source]}</div>}
            {mode === "recall" && prompt ? (
              <>
                <div className="card-recall-tag">Recall</div>
                <div className="card-char">{prompt}</div>
              </>
            ) : (
              <div className="card-char" lang="ja">{card.character}</div>
            )}
            {!revealed && <div className="card-hint">Ketuk untuk membuka</div>}
          </div>
          <div className="card-face card-back">
            <div className="card-kicker">{kicker}</div>
            <KanaBack card={card} />
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
