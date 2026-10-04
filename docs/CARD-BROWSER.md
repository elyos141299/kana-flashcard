# CARD-BROWSER.md

Phase 17 — Card Browser.

## Konsep

Bukan dictionary. Hanya: Browse → lihat kartu → lihat status →
Favorite / Suspend → pilih untuk belajar.

Akses: tombol `Browse Cards →` di Study Setup (tidak menambah tab utama).

## Search

Mencari di card metadata yang sudah ada: character, reading, romaji.

- case-insensitive untuk Latin/romaji (`NE` → ね)
- trim whitespace, Unicode NFC
- kana: character + romaji; kanji: character + onyomi/kunyomi/common readings
- tidak mencari arti/definisi (bukan dictionary)
- tidak ketemu → `No cards found.` (bukan error)

## Filters

- Dataset: All / Kana / Kanji
- Kana: Hiragana / Katakana
- Kanji: All / N5 / N4 / N3 / N2 / N1
- Status: All / Favorite / Suspended / Due / New / Learning / Review
  (status memakai `classifySource` existing — tanpa logika duplikat)
- Filter dapat dikombinasikan (mis. Kanji + N5 + Favorite)
- Default sort: dataset order. Pagination 20 kartu/halaman.

## Status display

`New / Learning / Review / Due / Favorite / Suspended`.
Tidak menampilkan dueAt, ease, atau istilah scheduler.

## Card detail

Klik kartu → detail (list → detail → back, tanpa modal rumit):
character, reading/meaning, status (+ waktu relatif bila belum due),
audio (kana / ON / KUN seperti behavior existing), Favorite, Suspend.

Membuka detail tidak mengubah SRS.

## Study This Card

Eligibility (ditentukan sekali, konsisten):

| Kondisi | Behavior |
|---------|----------|
| Suspended | `Unsuspend first` — tidak masuk queue |
| New + daily new limit tersedia | one-card session (mode dipilih dulu) |
| New + limit habis | pesan limit, tersedia besok |
| Learning/Review due | one-card session, rating memengaruhi SRS normal |
| Review due + review limit habis | pesan limit |
| Belum due | **Preview only** — reveal + audio, tanpa rating |

Preview memakai komponen flashcard dengan `previewOnly` (rating disembunyikan)
agar tidak menjadi bypass SRS.

One-card session memakai flow session existing: mode dikunci, rating via
`rateCard`, daily counters bertambah normal.

## Favorite / Suspend

Toggle langsung di list (★) dan detail. Metadata memakai cardId yang sama
dengan SRS dan semua mode. Suspend memakai konfirmasi yang sama seperti
flashcard. Semua survive refresh/close-reopen; ikut export/import.

## Performance

- Dataset (~1950 kartu) dibangun sekali per mount (`useMemo`).
- Search + filter di-memoize; tidak ada full processing per keystroke
  di luar memo (input → state → satu recompute).
- Pagination 20/halaman — tidak render ribuan row sekaligus.
- Bundle: JS ~769 KB raw / ~190 KB gzip.

## Accessibility

- Search memakai `<label>`; list memakai `<ul>` semantik; actions native button.
- Escape kembali dari detail/preview; focus-visible; touch target ≥44px.
