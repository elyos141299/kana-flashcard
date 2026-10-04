# CONTENT-LOCALIZATION.md

Phase 22 — kebijakan lokalisasi konten Bahasa Indonesia.

## Localization policy

- Semua `meaning` Kanji dan `example meaning` yang tampil ke user memakai
  Bahasa Indonesia yang natural, ringkas, dan beginner-friendly.
- English source gloss (KANJIDIC2/EDRDG, JMdict) diterjemahkan secara ringkas,
  maksimal 3 arti per kanji. Terjemahan Indonesia adalah hasil lokalisasi kami,
  bukan teks asli source — atribusi source tetap di `docs/KANJI-SOURCES.md`.
- Jangan mengarang example, reading, atau meaning baru (§13).
- Jika makna ambigu dan konteks tidak cukup: JANGAN menebak — laporkan.

## Indonesian meaning policy

- Ringkas lebih baik: `杉` → "pohon cedar", bukan "pohon kayu cedar".
- Disambiguasi dalam kurung dipertahankan karena membantu pembelajar:
  "panas (cuaca)", "hari (pekan)", "mencuci (barang)".
- Prefix marker dipertahankan: "ke-" (第), "non-" (非).
- Istilah yang sudah natural dalam Bahasa Indonesia dipertahankan
  ("nilai nominal", "buku harian / diary").

## Capitalization policy

- Default: lowercase natural Indonesian ("film", "mencuci muka").
- Proper noun tetap kapital: "Jepang", "Eropa", "Tokyo", "Bima Sakti".
- Akronim tetap kapital: "ASI", "AC", "DPR", "RUU".
- ALL-CAPS dan Title Case untuk kata biasa dinormalisasi ke lowercase.

## Source attribution

- Bacaan (ON/KUN/common) dan data kanji: KANJIDIC2 (EDRDG).
- Contoh kosakata: subset JMdict berterjemahan Indonesia (EDRDG, CC BY-SA 4.0).
- Detail: `docs/KANJI-SOURCES.md`.

## Ambiguous content policy

- Kandidat English → verifikasi manual terhadap source sebelum diubah.
- Tidak ada tebakan untuk reading, example, atau meaning baru.

## How candidate English is detected

1. Automated scan (dev-only, tidak masuk production bundle):
   - penanda kata English kuat (the/of/with/without/from/...) dengan word boundary
   - pola `to + verb` di awal gloss
   - ALL-CAPS, artefak (`()[]*~`, "obsolete", spasi ganda)
2. Semua kandidat di-review manual dan diklasifikasikan:
   VALID / FIX / AMBIGUOUS / SOURCE ARTIFACT.
3. Yang diperbaiki hanya yang jelas (FIX); sisanya dibiarkan/dilaporkan.

## Audit statistics (Phase 22, scan nyata)

- Total Kanji audited: 1724 (N5 114, N4 168, N3 350, N2 543, N1 549)
- Meanings: 2271 — English candidates: 0, Indonesian: 2271, Ambiguous: 0
- Example meanings: 2945 — English candidates: 0, Indonesian: 2945, Ambiguous: 0
- Capitalization candidates: 225 (79 ALL-CAPS + 146 Title Case)
- Dictionary artifact candidates: 204 flagged → mayoritas VALID
  (disambiguasi kurung); artefak nyata: 8 (sense number "2", "saat2",
  spasi kurung, duplikat "SEDIH; Sedih")
- Typo jelas diperbaiki: 4 ("Mendaftakan"→"Mendaftarkan",
  "Mambayar"→"Membayar", "Meletakan"→"Meletakkan", "Menyetting"→"menyetel")
- Total: 204 replacements pada 183 kartu (184 string unik)
- N1 tanpa example: 361 — dibiarkan kosong (bukan bug, §21)

## Classification summary

- VALID: disambiguasi kurung (175), proper noun, akronim (ASI/AC/DPR/RUU),
  prefix (ke-/non-), istilah natural ("nilai nominal")
- FIX: 184 string (lowercase normalization + typo + artefak)
- AMBIGUOUS: 0
- SOURCE ARTIFACT (fixed): 8
