# DATA-QUALITY-NOTES.md

Catatan kualitas data yang disengaja (intentional), berasal dari source,
dan ditunda untuk review mendatang. **Jangan diubah massal tanpa keputusan produk.**

## Status

### N1 tanpa examples — INTENTIONAL
- 361 dari 549 kartu N1 tidak memiliki contoh kata.
- Alasan: subset JMdict berlisensi yang dipakai tidak menyediakan contoh untuk kanji tersebut.
- Kebijakan (§8): lebih baik kosong daripada mengarang. UI sudah menangani kartu tanpa contoh tanpa error.
- Coverage: N5 114/114, N4 168/168, N3 350/350, N2 543/543, N1 188/549.

### Kapitalisasi artefak dari source — SOURCE-DERIVED
- Beberapa arti contoh memakai kapitalisasi tidak konsisten, contoh:
  - N4 歩く → "Berjalan"
  - N4 奥さん → "ISTRI (ORANG LAIN)"
  - N4 危険 → "bahaya; BAHAYA"
  - N3 留守 → "TIDAK ADA DI RUMAH"
- Berasal dari subset contoh JMdict ber-Indonesia yang dipakai sebagai source.
- Kosmetik, bukan kesalahan faktual. Tidak diubah massal.

### Reading spesifik-source — SOURCE-DERIVED
- N3 打 ON mencakup "だーす" (dari kata ダース/dozen) — tercatat di KANJIDIC2, faktual tapi ganjil untuk pembelajar.
- Tidak dihapus: setia pada source kamus.

## Sudah diperbaiki (Phase 8)

### Reading duplikat — FIXED
- 62 kartu memiliki reading ganda identik akibat cleaning notasi KANJIDIC2
  (contoh: N5 水 KUN `みず, みず`; N3 児 KUN `こ, こ`).
- Diperbaiki dengan dedupe preserving order di `src/data/kanji/*.ts`. 0 sisa.

### Contoh 添う — FIXED
- N1 添 (kanji-n1-001): contoh 添う/そう bermakna "Memenuhi" — bertentangan
  dengan arti kartu ("melampirkan, menemani").
- Diperbaiki menjadi "menemani", didukung arti kartu dari KANJIDIC2.

### Arti 杉 dalam Bahasa Inggris — FIXED (Phase 21)
- N2 杉 (kanji-n2-077): meanings = ["cedar"] (Bahasa Inggris), tidak konsisten
  dengan arti Bahasa Indonesia di seluruh dataset.
- Glosarium Inggris KANJIDIC2 untuk 杉 memang "cedar" — source terverifikasi.
- Diperbaiki menjadi ["pohon cedar"], konsisten dengan meaning contoh pada
  kartu yang sama (杉/すぎ = "pohon cedar").
- Tidak mengubah: character, level, ON/KUN readings, examples, cardId.
  cardId tetap → progress SRS tidak terpengaruh.

## Future review
- Normalisasi kapitalisasi arti contoh (perlu source valid atau keputusan produk).
- Review reading langka/loanword seperti "だーす" untuk kelayakan pedagogis.
