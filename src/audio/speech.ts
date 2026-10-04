/**
 * Service TTS Jepang memakai Web Speech API milik browser/perangkat.
 *
 * - Tanpa cloud, tanpa API key, tanpa network request.
 * - Text Jepang diproses oleh speech engine lokal perangkat.
 * - TTS availability depends on browser and device-installed voices.
 */
import type { JapaneseVoice, SpeakCallbacks } from "./types.js";

const LANG = "ja-JP";
/** Sedikit lebih lambat dari 1.0 agar jelas untuk pembelajar. */
const RATE = 0.95;
const PITCH = 1.0;
const VOLUME = 1.0;

/** Cek dukungan Web Speech API. */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.speechSynthesis?.speak === "function"
  );
}

function rawVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

/** Daftar Japanese voice yang tersedia, dengan ja-JP diprioritaskan. */
export function getJapaneseVoices(): JapaneseVoice[] {
  const voices = rawVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("ja"))
    .map((v) => ({ name: v.name, lang: v.lang }));
  voices.sort((a, b) => {
    const aExact = a.lang.toLowerCase() === "ja-jp" ? 0 : 1;
    const bExact = b.lang.toLowerCase() === "ja-jp" ? 0 : 1;
    return aExact - bExact;
  });
  return voices;
}

/** Voice Jepang terbaik yang tersedia, atau null. */
export function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = rawVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang.toLowerCase() === "ja-jp") ?? voices[0]
  );
}

/** Daftarkan callback saat daftar voice berubah (browser memuatnya async). */
export function onVoicesChanged(cb: () => void): () => void {
  if (!isSpeechSupported()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

/**
 * Ucapkan teks Jepang. Selalu cancel speech lama dulu agar tidak bertumpuk.
 * @returns true jika speech dimulai, false jika tidak didukung / tidak ada voice Jepang.
 */
export function speakJapanese(text: string, cb?: SpeakCallbacks): boolean {
  if (!isSpeechSupported()) return false;
  const voice = pickJapaneseVoice();
  if (!voice) return false;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG;
  utterance.voice = voice;
  utterance.rate = RATE;
  utterance.pitch = PITCH;
  utterance.volume = VOLUME;
  if (cb?.onStart) utterance.onstart = () => cb.onStart?.();
  const done = () => cb?.onEnd?.();
  utterance.onend = done;
  utterance.onerror = done;

  window.speechSynthesis.speak(utterance);
  return true;
}

/** Hentikan speech yang sedang berjalan. */
export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* abaikan */
  }
}
