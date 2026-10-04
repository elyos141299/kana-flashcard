import { useEffect, useState } from "react";
import { isSpeechSupported, getJapaneseVoices, onVoicesChanged } from "./index.js";

/**
 * true jika browser mendukung speechSynthesis DAN ada Japanese voice.
 * Memantau voiceschanged karena browser memuat voice secara async.
 */
export function useJapaneseAudioAvailable(): boolean {
  const [available, setAvailable] = useState<boolean>(() =>
    isSpeechSupported() && getJapaneseVoices().length > 0,
  );

  useEffect(() => {
    const check = () =>
      setAvailable(isSpeechSupported() && getJapaneseVoices().length > 0);
    check();
    return onVoicesChanged(check);
  }, []);

  return available;
}
