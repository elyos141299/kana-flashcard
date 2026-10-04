# STUDY-MODES.md

## Recognition vs Recall

Aplikasi memiliki dua study mode. Keduanya melatih kartu yang SAMA
dengan SATU progress SRS yang sama — mode hanya mengubah cara prompt ditampilkan.

### Recognition (default)

```
Japanese → reading / meaning
```

- Kana: `ね` → reveal → `NE`
- Kanji: `学` → reveal → `がく / まなぶ / belajar`

Ini mode yang sudah ada sejak awal; behavior tidak berubah.

### Recall

```
romaji → Kana
reading → Kanji
```

- Kana: `NE` → reveal → `ね` + `NE`
- Combination: `KYA` → reveal → `きゃ`
- Small kana: `SMALL TSU` → reveal → `っ`
- Kanji: `がく` → reveal → `学` (+ reading/meaning/examples)

> Recognition dan Recall menggunakan card/progress yang sama;
> mode hanya mengubah cara prompt ditampilkan.

## Aturan penting

1. **Satu cardId, satu progress.** Tidak ada `学-recognition` / `学-recall`
   sebagai kartu terpisah. Rating dari mode mana pun menulis ke
   `progress[cardId]` yang sama.
2. **Prompt kanji deterministic.** Satu reading dipilih dengan prioritas
   `common reading → ON → KUN`, dihitung sekali saat sesi dimulai dan
   disimpan di session card (tidak random, tidak berubah saat reveal).
3. **Prompt dari data kartu.** Tidak ada reading yang dikarang;
   semua prompt berasal dari `onyomi` / `kunyomi` / `commonReadings` /
   `romaji` kartu tersebut.
4. **Mode dikunci per sesi.** Dipilih di Study Setup (default Recognition),
   berlaku untuk semua kartu dalam sesi itu.
5. **Audio tidak membocorkan jawaban.** Di mode recall, tombol audio hanya
   muncul SETELAH reveal (di sisi jawaban).
6. **SRS tidak berubah.** Again/Hard/Good/Easy dan interval tetap sama
   di kedua mode.

## Implementasi

- `src/study/modes.ts` — tipe `StudyMode`, `SessionCard`,
  `getKanaRecallPrompt`, `getKanjiRecallPrompt`, `buildSessionCard`.
- `src/pages/Study.tsx` — mode selector (radiogroup) di setup,
  session card menyimpan `prompt`, ringkasan sesi menampilkan mode.
- `src/components/Flashcard.tsx`, `KanjiFlashcard.tsx` — prop
  `mode` + `prompt`; depan kartu recall menampilkan prompt.
