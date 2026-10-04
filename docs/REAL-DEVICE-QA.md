# REAL-DEVICE-QA.md

Protokol QA perangkat nyata — Phase 14.

Production URL: `https://elyos141299.github.io/kana-flashcard/`

**Jangan mengklaim PASS untuk item yang belum benar-benar dijalankan
pada perangkat nyata.**

---

# WINDOWS

Browser: Chrome, Edge

1. [ ] Open production URL
2. [ ] Home
3. [ ] Study
4. [ ] Hiragana
5. [ ] Katakana
6. [ ] Kanji N5
7. [ ] Kanji N1
8. [ ] Recognition
9. [ ] Recall
10. [ ] Flashcard reveal
11. [ ] Audio
12. [ ] Again / Hard / Good / Easy
13. [ ] Session Complete
14. [ ] Progress
15. [ ] Settings
16. [ ] Dark / Light / System
17. [ ] Export
18. [ ] Reset
19. [ ] Import
20. [ ] Refresh persistence
21. [ ] Close browser → reopen
22. [ ] Resize window
23. [ ] Keyboard Tab
24. [ ] Enter / Space
25. [ ] Check horizontal overflow

---

# IPHONE SAFARI

1. [ ] Open production URL
2. [ ] Portrait
3. [ ] Home
4. [ ] Study
5. [ ] Hiragana
6. [ ] Katakana
7. [ ] Kanji N5–N1
8. [ ] Recognition
9. [ ] Recall
10. [ ] Reveal
11. [ ] Audio
12. [ ] Rating
13. [ ] Progress
14. [ ] Settings
15. [ ] Share → Add to Home Screen
16. [ ] Launch installed PWA
17. [ ] Check standalone appearance
18. [ ] Check safe-area spacing
19. [ ] Check touch targets
20. [ ] Check horizontal overflow

---

# OFFLINE

Procedure:

Online:
→ open app
→ visit Home
→ Study
→ several flashcard types
→ Progress
→ ensure assets loaded

Then:
→ disable internet
→ reload
→ open Study
→ run flashcards
→ reveal
→ rating
→ Progress

**Do NOT mark offline as PASS until tested on real device.**

- [ ] Online load + kunjungi semua layar
- [ ] Disable internet → reload → app shell terbuka
- [ ] Flashcard jalan offline
- [ ] Reveal + rating offline
- [ ] Progress tersimpan lokal

---

# PERSISTENCE

Test:

rate cards
→ refresh
→ progress remains

Then:

close browser completely
→ reopen
→ progress remains

Then:

export
→ reset
→ import
→ progress restored

- [ ] Rate → refresh → progress tetap
- [ ] Close browser → reopen → progress tetap
- [ ] Export → reset → import → progress kembali

---

# AUDIO

Specifically test:

Kana:
- [ ] ね
- [ ] きゃ

Kanji:
- [ ] one N5 card
- [ ] one N1 card
- [ ] multiple ON/KUN readings
- [ ] example word audio

Check:
- [ ] no overlapping speech
- [ ] Next card stops previous audio
- [ ] audio only after reveal
- [ ] sound quality is acceptable

---

# REPORT FORMAT

```
REAL DEVICE QA REPORT

Windows Chrome
PASS / FAIL
Issues:

Windows Edge
PASS / FAIL
Issues:

iPhone Safari
PASS / FAIL
Issues:

PWA Add to Home Screen
PASS / FAIL
Issues:

Audio
PASS / FAIL
Issues:

Offline
PASS / FAIL
Issues:

Persistence
PASS / FAIL
Issues:

Responsive
PASS / FAIL
Issues:

Accessibility
PASS / FAIL
Issues:
```

---

# Hasil

| Tanggal | Perangkat | Penguji | Ringkasan |
|---------|-----------|---------|-----------|
|         |           |         |           |

---

# Phase 25 — Automated verification (4 Okt 2026)

Hasil dari test/build/static audit. **Bukan pengganti real-device QA.**

**Aturan status:** `PASS — AUTO` = terverifikasi otomatis.
`NOT VERIFIED` = butuh real device, belum diuji. Jangan menulis PASS palsu.

## Production config — PASS — AUTO

- Site 200; semua asset memakai base `/kana-flashcard/` (JS/CSS/manifest/SW/icons).
- Manifest valid: `start_url` + `scope` = `/kana-flashcard/`, display standalone.
- Icons 192/512/maskable: 200. SW + registerSW.js: 200.
- Tidak ada absolute `/assets/...` yang salah.

## PWA / offline — NOT VERIFIED

- Konfigurasi static benar, tetapi install prompt, standalone mode,
  dan offline setelah install belum diuji di device nyata.

## Regression — PASS — AUTO

- 334/334 tests PASS (24 files), build PASS, lint 0 errors.
- Mencakup: SRS, queue, mixed study, semua mode belajar, favorites/suspend,
  card browser, progress, study history, persistence, export/import,
  migration, PWA config.

## Static UI audit — PASS — AUTO

- Touch target: semua tombol interaktif ≥44px
  (audio-btn-sm diperbaiki 36px → 44px di Phase 25).
- Focus: global `:focus-visible`, plus khusus heatmap & typing input.
- Safe-area: `env(safe-area-inset-bottom)` di tab bar.
- Layout mobile-first max 520px; heatmap max 420px; tanpa overflow horizontal.
- Visual identity tidak berubah (Japanese minimalism).

## Study History — PASS — AUTO

- Range 7/30/Semua + default 30 Hari: unit test.
- Empty date, key invalid, gap tanggal: unit test.
- Detail harian + "No study activity": SSR test.
- Streak memakai existing stats; tidak ada interpretasi statistik baru.
- Heatmap: `<button>` + aria-label per tanggal ("Senin, 5 Okt 2026: 20 kartu
  dipelajari") — terbaca screen reader tanpa mengandalkan warna.

## Audio — PASS — AUTO (static)

- `ja-JP` diprioritaskan; tanpa autoplay; speech lama di-cancel sebelum baru;
  tanpa efek ke SRS. Ketersediaan voice tergantung device
  (headless tanpa Japanese voice = bukan bug).

## Data safety — PASS — AUTO

- Reload aman (localStorage sinkron).
- Future schema ditolak (ter-cover test); orphan dilaporkan, tidak dihapus diam-diam.
- Reset menghapus stats+progress, mempertahankan favorite/suspend.

## Performance — PASS — AUTO

- Bundle JS ~779KB raw (~190KB gzip), CSS ~14KB — stabil vs Phase 24 (+6KB).
- Tanpa chart library; heatmap murni CSS; tidak ada full dataset scan per render.
