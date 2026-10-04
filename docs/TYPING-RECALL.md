# TYPING-RECALL.md

Phase 15 — Typing Recall mode.

## Purpose

Mode belajar aktif: user mengetik jawaban (karakter Jepang) sebelum melihat
hasil, lalu menilai sendiri seperti mode lain. Bukan quiz engine terpisah —
hanya presentation/input mode untuk kartu yang sama.

## Supported modes

| Mode | Prompt | Input | Expected answer |
|------|--------|-------|-----------------|
| Recognition (default) | karakter Jepang | — (tap reveal) | — |
| Recall | romaji / reading | — (tap reveal) | — |
| Typing Recall | romaji / reading | ketik karakter Jepang | karakter Jepang |

Mode dipilih di Study Setup dan dikunci selama sesi.

## Kana behavior

- Prompt: romaji uppercase (`NE`) + indikator script (`Type it in Hiragana`).
- Small kana tanpa romaji: prompt `SMALL TSU`.
- Jawaban: karakter kana (`ね`). Romaji (`ne`) diterima sebagai alternatif.
- Input mendukung Japanese IME, copy/paste, keyboard Jepang — tidak ada
  transliterasi otomatis.

## Kanji behavior

- Prompt: reading yang dipilih session builder (sama seperti Recall:
  `commonReadings[0] → onyomi[0] → kunyomi[0]`), tidak di-randomize ulang.
- Jawaban: karakter kanji (`日`). Reading (`にち`) TIDAK diterima.

## Normalization & exact matching

Normalisasi aman sebelum dibandingkan:
- trim leading/trailing whitespace
- Unicode NFC

Selain itu matching bersifat exact. Karakter yang berbeda tetap salah:
`ね ≠ ぬ`, `日 ≠ 曰`, `し ≠ じ`, `っ ≠ つ`.

## Same cardId

Recognition, Recall, dan Typing Recall memakai `cardId` yang sama dan
progress SRS yang sama. Tidak ada duplikat kartu per mode.
`expectedAnswer` hanya transient session data — tidak disimpan ke
permanent progress storage.

## SRS behavior

- Correctness (hasil Check) terpisah dari rating SRS.
- User tetap menilai manual: Again / Hard / Good / Easy.
- Satu rating = satu `recordReview(cardId)` seperti mode lain.
- Daily counters (New / Review / Learning) dihitung sama seperti mode lain.
- Statistik typing (correct/incorrect) hanya session-level, tidak permanen.

## Flow

```
Prompt → Input → Check → Result → Reveal (otomatis) → Rating
```

- Check disabled jika input kosong; Enter memicu Check.
- Setelah Check: input dikunci, hasil ditampilkan (`aria-live`),
  jawaban benar langsung terlihat — tidak ada tombol Reveal kedua.
- Rating tidak muncul sebelum Check.
- Setelah rating, input state di-reset untuk kartu berikutnya.

## Audio

Audio (kana / ON / KUN / example) hanya muncul setelah Check.
Tidak ada audio jawaban sebelum Check. Tidak ada autoplay.

## Limitations (Phase 15)

- Tidak ada transliterasi romaji→kana otomatis.
- Tidak ada fuzzy scoring / AI grading.
- Tidak ada skor kecepatan mengetik, XP, atau gamifikasi.
- Tidak ada statistik typing permanen.
