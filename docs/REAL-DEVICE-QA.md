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
