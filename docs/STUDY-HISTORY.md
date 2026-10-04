# Study History (Phase 24)

Visualisasi aktivitas belajar harian di tab Progress. Bukan sistem
pembelajaran baru — hanya membaca data yang sudah ada.

## Source of truth

- `Stats.days` (`"YYYY-MM-DD"` lokal → `DayStats`) di `src/storage/progress.ts`.
- Tidak ada storage baru, tidak ada schema migration (Phase 24).
- `recordReview` + `recordCardRated` selalu dipanggil bersamaan di
  `handleRate` (Study.tsx), jadi `reviewed` ≈ `newCards + learningCards + reviewCards`
  untuk data yang tercatat setelah Phase 12. Data lama memakai `?? 0`.

## Daily data

Per tanggal:
- **Cards studied** = `day.reviewed` (jumlah rating yang diberikan hari itu).
- **New / Learning / Review** = `day.newCards` / `day.learningCards` / `day.reviewCards`
  (kategori kartu *saat dinilai*, bukan saat masuk queue).
- Tidak ada penghitungan ulang dari queue/SRS — angka diambil langsung
  dari stats yang tercatat.

## Range

- `7 Hari` / `30 Hari` / `Semua` (default: 30 Hari). Tanpa date picker.
- 7/30: N hari terakhir termasuk hari ini (hari kosong tetap tampil).
- Semua: dari tanggal tercatat paling awal sampai hari ini.
- Logika murni di `src/history/dates.ts` (testable, tanpa storage).

## Heatmap

- Grid 7 kolom (Senin dulu), satu sel per hari.
- Intensitas vermilion: 0 → kosong; 1–4 → muda; 5–14 → sedang;
  15–29 → tua; 30+ → penuh.
- Setiap sel adalah `<button>` dengan `aria-label`
  ("Senin, 5 Okt 2026: 20 kartu dipelajari") — terbaca tanpa warna.
- Ketuk sel → detail harian di bawahnya. Hari kosong → "No study activity".

## Streak

- Memakai `stats.streak` existing (dihitung di `recordReview`).
- Tidak ada algoritma streak kedua, tidak ada reward/XP.

## Learned definition

- `Learned = state === "review"` — sama seperti bagian Kana/Kanji.
- Tidak ada istilah "Mastered" — aplikasi tidak mengukur mastery.

## Reset behavior

- Reset Progress menghapus `STATS_KEY` → seluruh Study History ikut terhapus.
- Favorite dan Suspend dipertahankan (tidak berubah dari Phase 16).
- UI Settings menjelaskan behavior ini.

## Export / import

- `stats` (termasuk `days`) sudah ikut export/import sejak Phase 19.
- Tidak ada field baru di Phase 24 → tidak ada perubahan format.

## Limitations (disengaja)

- Tidak ada retention % — rating SRS adalah self-assessment, bukan skor benar/salah.
- Tidak ada XP, achievements, leaderboard, gamification.
- Tidak ada grafik tahunan; maksimal "Semua" (harian).
- Data sebelum Phase 12 tidak punya breakdown New/Learning/Review
  (ditampilkan 0 untuk kategori tersebut, `reviewed` tetap ada).
