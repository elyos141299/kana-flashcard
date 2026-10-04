/**
 * Daftar aksi audio per kartu. UI tinggal me-render tombol dari daftar ini.
 * Text yang diucapkan SELALU teks Jepang (bukan romaji, bukan arti Indonesia).
 */
import type { KanaCard } from "../data/kana/index.js";
import type { KanjiCard } from "../data/kanji/index.js";

export interface AudioAction {
  /** id unik dalam kartu, mis. "char", "on", "kun", "ex-0" */
  id: string;
  /** label aksesibilitas, mis. "Putar pengucapan ね" */
  label: string;
  /** teks Jepang yang akan diucapkan */
  text: string;
}

/**
 * Audio untuk kartu kana: ucapkan karakter itu sendiri.
 * Untuk small kana (っ/ッ): ucapkan karakternya apa adanya — jujur,
 * tanpa label palsu seperti "small tsu". Keterbatasan: TTS browser
 * mungkin tidak menghasilkan bunyi bermakna untuk っ/ッ yang berdiri sendiri.
 */
export function getKanaAudioActions(card: KanaCard): AudioAction[] {
  return [
    {
      id: "char",
      label: `Putar pengucapan ${card.character}`,
      text: card.character,
    },
  ];
}

const READING_SEP = "、";

/**
 * Audio untuk kartu kanji, mengikuti urutan prioritas:
 * ON reading → KUN reading → example reading.
 * Beberapa reading digabung dengan jeda natural (、).
 */
export function getKanjiAudioActions(card: KanjiCard): AudioAction[] {
  const actions: AudioAction[] = [];
  if (card.onyomi.length > 0) {
    actions.push({
      id: "on",
      label: "Putar bacaan ON",
      text: card.onyomi.join(READING_SEP),
    });
  }
  if (card.kunyomi.length > 0) {
    actions.push({
      id: "kun",
      label: "Putar bacaan KUN",
      text: card.kunyomi.join(READING_SEP),
    });
  }
  card.examples.slice(0, 3).forEach((ex, i) => {
    if (ex.reading) {
      actions.push({
        id: `ex-${i}`,
        label: `Putar contoh ${ex.reading}`,
        text: ex.reading,
      });
    }
  });
  return actions;
}
