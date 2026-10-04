/** Tipe untuk modul audio (Web Speech API, tanpa cloud). */

export interface JapaneseVoice {
  name: string;
  lang: string;
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
}
