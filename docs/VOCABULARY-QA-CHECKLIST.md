# N5 Vocabulary — Real-Device QA Checklist

Tanggal dibuat: 4 Oktober 2026
Status: Siap untuk verifikasi perangkat nyata
Production: BELUM di-push

---

## 1. DESKTOP QA (Windows Chrome / Edge)

### Vocabulary Navigation
- [ ] Buka tab Progress → section "Vocabulary" muncul
- [ ] Vocabulary N5 menunjukkan "0 / 500"
- [ ] Buka Browse → filter "Vocab" muncul
- [ ] Search "食べる" → ketemu
- [ ] Search "たべる" → ketemu
- [ ] Search "makan" → ketemu
- [ ] Search "だれ" → ketemu 誰

### Recognition Mode
- [ ] Study → Category "語 Vocabulary" → Start
- [ ] Front menampilkan kata Jepang
- [ ] Ketuk kartu → reveal
- [ ] Reading tampil benar
- [ ] Arti Indonesia tampil
- [ ] Example tampil (bila ada)
- [ ] Tombol audio berfungsi
- [ ] Favorite (☆) berfungsi
- [ ] Suspend berfungsi
- [ ] Rating Again/Hard/Good/Easy berfungsi

### Recall Mode
- [ ] Front menampilkan arti Indonesia
- [ ] Reveal → kata Jepang muncul
- [ ] Reading + arti + example benar
- [ ] Audio berfungsi
- [ ] Rating berfungsi

### Typing Recall Mode
- [ ] Prompt arti Indonesia tampil
- [ ] Input otomatis focus
- [ ] Ketik kata Jepang (gunakan IME Japanese)
- [ ] Tekan Enter → submit
- [ ] Jawaban benar → "✓ Correct"
- [ ] Jawaban salah → "✕ Not quite" + perbandingan
- [ ] Input kosong → tombol Check disabled
- [ ] Input spasi saja → di-trim
- [ ] Setelah Check → rating manual muncul
- [ ] Audio muncul setelah Check (tidak sebelumnya)

---

## 2. SPECIAL CASE QA

Test satu per satu di Browse atau Study:

### 何
- [ ] Reading utama: なに
- [ ] Secondary: なん (tampil di ALT)
- [ ] Example これは何ですか → reading これはなんですか
- [ ] Audio example memakai なん (bukan なに)

### 良い
- [ ] Reading utama: いい
- [ ] Secondary: よい
- [ ] Satu card saja (tidak duplicate)

### 誰
- [ ] Tampil 誰 (kanji), bukan だれ saja
- [ ] Reading: だれ
- [ ] Arti: siapa

### ある vs いる
- [ ] ある: ada (benda mati)
- [ ] いる: ada (makhluk hidup)
- [ ] Tidak tertukar

### 近い vs 近く
- [ ] 近い: dekat (adjective)
- [ ] 近く: dekat / di dekat (noun/adverb)

### 開く vs 開ける
- [ ] 開く: terbuka (intransitive, あく)
- [ ] 開ける: membuka (transitive, あける)

### 閉まる vs 閉める
- [ ] 閉まる: tertutup (しまる)
- [ ] 閉める: menutup (しめる)

### 時間 / 高い
- [ ] Multiple meanings tampil
- [ ] Satu card saja

### 勉強 / ごめん / バス停
- [ ] 勉強: belajar
- [ ] ごめん: maaf (expression)
- [ ] バス停: reading バスてい (mixed script)

### Verifikasi Negatif
- [ ] Tidak ada wrong reading
- [ ] Tidak ada wrong meaning
- [ ] Tidak ada duplicate card
- [ ] Tidak ada wrong audio
- [ ] Tidak ada wrong example reading

---

## 3. MOBILE SAFARI (iPhone)

- [ ] Portrait: tidak ada horizontal overflow
- [ ] Landscape: layout tetap rapi
- [ ] Touch target cukup besar (tombol rating, audio)
- [ ] Scrolling halus
- [ ] Keyboard terbuka saat Typing Recall
- [ ] Keyboard tidak menutupi tombol Check/submit
- [ ] Tombol Enter di keyboard berfungsi submit
- [ ] Japanese keyboard (flick/kana) berfungsi untuk input
- [ ] Audio TTS berfungsi
- [ ] Favorite berfungsi
- [ ] Suspend berfungsi
- [ ] Progress ter-update
- [ ] Study History ter-update
- [ ] Reload halaman → data tetap ada
- [ ] Safari back/forward tidak merusak state
- [ ] Safe area / notch tidak menutupi konten

---

## 4. PWA

- [ ] Add to Home Screen berhasil
- [ ] Launch dari Home Screen (standalone, tanpa address bar)
- [ ] Vocabulary N5 loads
- [ ] Study Recognition berfungsi
- [ ] Study Recall berfungsi
- [ ] Typing Recall berfungsi
- [ ] Audio berfungsi
- [ ] Favorite/suspend berfungsi
- [ ] Persistence setelah close/reopen
- [ ] Rotasi orientasi tidak merusak layout

---

## 5. OFFLINE

1. [ ] Buka app saat online
2. [ ] Buka Vocabulary N5 (pastikan asset ter-load)
3. [ ] Matikan internet (airplane mode)
4. [ ] Reload halaman
5. [ ] Vocabulary tetap terbuka
6. [ ] Recognition berfungsi offline
7. [ ] Recall berfungsi offline
8. [ ] Typing Recall berfungsi offline
9. [ ] Favorite/suspend berfungsi offline
10. [ ] Progress ter-update offline

**Catatan:** Audio TTS mungkin tidak tersedia offline (tergantung voice yang ter-install di perangkat). Catat secara eksplisit.

---

## 6. VISUAL QA

- [ ] Vocabulary card terasa konsisten dengan Kana/Kanji
- [ ] Typography Jepang terbaca jelas
- [ ] Spacing tidak berantakan
- [ ] Example tidak overflow
- [ ] Tombol audio sejajar
- [ ] Favorite/suspend icon jelas
- [ ] Progress meter tampil benar
- [ ] Mobile: tidak ada elemen terpotong

**Jangan redesign.** Jika ada masalah, dokumentasikan saja.

---

## 7. PERFORMANCE (Sanity Check)

- [ ] First load tidak freeze
- [ ] Navigate ke Study cepat
- [ ] Buka vocabulary tidak lag
- [ ] Pindah kartu (next) responsif
- [ ] Typing tidak lag per keystroke
- [ ] Search Browse responsif
- [ ] Buka Progress cepat
- [ ] Tidak ada duplicate audio
- [ ] Tidak ada UI freeze

---

## 8. BUG REPORT FORMAT

Untuk setiap FAIL, catat:

```
Platform: (Windows / iPhone / dll)
Browser: (Chrome / Edge / Safari)
Device: (PC / iPhone 17 / dll)
Feature: (Recognition / Typing / Audio / dll)
Steps: (langkah reproduksi)
Expected: (yang seharusnya terjadi)
Actual: (yang terjadi)
Screenshot/video: (lampirkan)
Console error: (bila ada)
```

Jangan memperbaiki bug berdasarkan dugaan. Laporkan dulu.
