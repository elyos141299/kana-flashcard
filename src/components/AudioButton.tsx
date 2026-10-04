import { useState } from "react";
import { speakJapanese } from "../audio/index.js";

/**
 * Tombol play TTS Jepang. Kecil, minimal, konsisten di semua flashcard.
 * - Manual: hanya berbunyi saat ditekan.
 * - Menampilkan status "Memutar…" saat speech aktif.
 */
export function AudioButton({
  text,
  label,
  size = "md",
}: {
  text: string;
  label: string;
  size?: "sm" | "md";
}) {
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const ok = speakJapanese(text, {
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
    });
    if (!ok) setPlaying(false);
  };

  return (
    <button
      type="button"
      className={`audio-btn audio-btn-${size}${playing ? " is-playing" : ""}`}
      onClick={play}
      aria-label={playing ? "Sedang memutar" : label}
      aria-pressed={playing}
      title={label}
    >
      <span aria-hidden="true">{playing ? "🔊" : "🔈"}</span>
      <span className="audio-btn-text">{playing ? "Memutar…" : "Putar"}</span>
    </button>
  );
}
