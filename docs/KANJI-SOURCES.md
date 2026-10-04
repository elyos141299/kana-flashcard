# Sumber Dataset Kanji

## Pernyataan penting

**Dataset ini BUKAN "official JLPT N5 kanji list".**

JLPT (Japanese Language Proficiency Test) tidak mempublikasikan daftar resmi
kanji, kosakata, atau grammar per level untuk JLPT modern. Dataset di
`src/data/kanji/` adalah **"N5 Study Set"** — kumpulan kanji yang umum
dipelajari di level pemula (setara N5), disusun dari sumber di bawah.

Di UI, level boleh ditampilkan sebagai "Kanji N5" sebagai penanda tingkat
kesulitan belajar, bukan klaim sertifikasi resmi.

## Sumber data

### 1. KANJIDIC2 — Electronic Dictionary Research and Development Group (EDRDG)

- **URL:** http://www.edrdg.org/kanjidic/kanjidic2.xml.gz
- **Lisensi:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)
- **Info lisensi:** http://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- **Data yang diambil:** karakter kanji, bacaan ON (ja_on), bacaan KUN (ja_kun),
  arti bahasa Inggris (sebagai referensi penerjemahan).
- **Transformasi:**
  - Bacaan ON (katakana di sumber) dikonversi ke hiragana untuk tampilan konsisten.
  - Notasi kamus pada bacaan KUN dihapus (`.` pemisah okurigana, `-`
    penanda bentuk terikat); bacaan yang ditampilkan adalah bentuk bersihnya.
  - Maksimal 3 bacaan ON dan 3 bacaan KUN per kanji (urutan frekuensi sumber).
  - Tidak ada data yang dikarang; field kosong dibiarkan kosong.
- **Tanggal diambil:** 4 Oktober 2026.
- **Catatan:** KANJIDIC2 edisi saat ini TIDAK lagi memuat tag JLPT
  (EDRDG menghapusnya karena JLPT tidak menerbitkan daftar resmi) —
  konsisten dengan pernyataan di atas.

### 2. Seleksi "N5 Study Set" (114 kanji)

- **Dasar seleksi:** set N5 yang sebelumnya dikurasi untuk aplikasi
  "Belajar Bahasa Jepang" milik pengguna yang sama (data lokal,
  `~/workspace/nihongo-app/data/kanji.json`).
- **Verifikasi:** seluruh 114 karakter dikonfirmasi ada di KANJIDIC2.
  Daftar kanji adalah pengelompokan pedagogis umum (fakta), bukan ekspresi
  kreatif berhak cipta.
- Seluruh bacaan dan data kanji tetap diambil dari KANJIDIC2 (sumber #1).

### 3. Arti Bahasa Indonesia

- Diterjemahkan secara ringkas dari glosarium Inggris KANJIDIC2
  (terjemahan kamus sederhana, maksimal 3 arti per kanji).
- Arti Indonesia awal merujuk pada data milik pengguna sendiri;
  diverifikasi ulang terhadap arti Inggris KANJIDIC2.

### 4. Contoh kosakata (examples)

- **Sumber:** subset JMdict berterjemahan Indonesia dari proyek milik
  pengguna (`~/workspace/nihongo-app/data/dictionary_v2.json`, 6.752 entri).
- **Lisensi asal:** JMdict — EDRDG, CC BY-SA 4.0
  (http://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project).
- **Seleksi:** otomatis — kata ≤6 karakter yang mengandung kanji target,
  bacaan kana murni, diurutkan dari yang terpendek; maksimal 3 per kanji;
  contoh yang hanya berupa kanji itu sendiri dilewati.
- **Atribusi:** atribusi CC BY-SA untuk EDRDG dicantumkan di aplikasi
  (lihat catatan atribusi di Settings/About saat tersedia).

## Sumber data N4 (Phase 4, 4 Oktober 2026)

Pendekatan sama dengan N5:

- **KANJIDIC2/EDRDG** (CC BY-SA 4.0, diambil 4 Oktober 2026) untuk bacaan
  ON/KUN dan arti Inggris referensi; transformasi sama (ON katakana →
  hiragana, notasi kamus `.`/`-` dibersihkan, maks 3+3 bacaan).
- **Seleksi "N4 Study Set" (168 kanji):** set N4 yang sebelumnya dikurasi
  untuk aplikasi "Belajar Bahasa Jepang" milik pengguna yang sama;
  seluruh 168 karakter diverifikasi ada di KANJIDIC2.
- **Metode anti-overlap:** seleksi N4 dicek otomatis terhadap 114 karakter
  N5 — hasil: irisan kosong. Validasi ini juga menjadi automated test
  (`N4 ∩ N5 = empty`, FAIL bila overlap).
- **Contoh kosakata:** subset JMdict ber-Indonesia milik pengguna (CC BY-SA
  4.0, EDRDG), seleksi otomatis sama seperti N5. Empat kanji tidak memiliki
  contoh di subset tersebut (窓, 暇, 湖, 勇); contoh untuk keempatnya
  ditambahkan manual dari fakta kamus standar dengan bacaan yang
  terverifikasi terhadap KANJIDIC2: 窓 まど "jendela", 暇 ひま
  "waktu luang", 湖 みずうみ "danau", 勇気 ゆうき "keberanian".

## Sumber data N3 (Phase 5, 4 Oktober 2026)

- **Seleksi "N3 Study Set" (350 kanji):** tidak ada set N3 kurasi sebelumnya
  di proyek pengguna, sehingga seleksi diturunkan dari **classic KANJIDIC
  (EDRDG, CC BY-SA 4.0, http://www.edrdg.org/kanjidic/)** — kode `J2`
  (JLPT lama level 2, 739 kanji). Dari 739, dibuang semua karakter yang
  sudah ada di N5/N4 (121) → 618 kandidat. Dari 618, diambil **350 dengan
  frekuensi tertinggi** (kode `F` KANJIDIC, peringkat frekuensi koran —
  semakin kecil semakin umum). Alasan: 618 terlalu besar untuk satu study
  set dan mencakup kanji yang lebih cocok untuk N2; 350 sesuai ukuran study
  set N3 yang umum dan mengutamakan kanji paling berguna.
- **Bacaan/arti:** KANJIDIC2 (EDRDG, CC BY-SA 4.0, diambil 4 Oktober 2026);
  transformasi sama (ON katakana → hiragana, notasi kamus dibersihkan).
- **Arti Indonesia:** diterjemahkan ringkas dari glosarium Inggris KANJIDIC2
  (terjemahan kamus sederhana, maks 3 per kanji).
- **Contoh kosakata:** subset JMdict ber-Indonesia milik pengguna (CC BY-SA
  4.0, EDRDG), seleksi otomatis sama seperti N5/N4. Tujuh kanji tanpa contoh
  di subset (猫, 賢, 各, 構, 述, 央, 貿) diisi manual dari fakta kamus
  standar dengan bacaan terverifikasi KANJIDIC2: 猫 ねこ "kucing",
  賢い かしこい "pintar, bijak", 各自 かくじ "masing-masing",
  構え かまえ "sikap, pose", 述べる のべる "menyatakan",
  中央 ちゅうおう "tengah, pusat", 貿易 ぼうえき "perdagangan".
- **Validasi anti-overlap:** N3 ∩ N5 = ∅ dan N3 ∩ N4 = ∅ dicek otomatis
  (test FAIL bila overlap); utilitas test antar-level mudah diperluas
  untuk N2/N1.

## Sumber data N2 (Phase 6, 4 Oktober 2026)

Metodologi seleksi (§2: jumlah berasal dari metode, bukan target arbitrer):

```text
classic KANJIDIC J1 (old JLPT Level 1, 1207 kanji)
→ buang karakter yang sudah ada di N5/N4/N3 (12 overlap)
→ 1195 kandidat
→ filter frekuensi F ≤ 1500 (1500 kanji paling umum di koran)
→ 543 kanji final = N2 Study Set
```

- **Alasan J1:** tier kesulitan berikutnya setelah J2 (sumber N3/N4).
  J1 = old JLPT Level 1 (EDRDG, CC BY-SA 4.0,
  http://www.edrdg.org/kanjidic/, diambil 4 Oktober 2026).
- **Alasan F ≤ 1500:** kanji N2 harus umum dijumpai dalam bacaan nyata;
  kanji yang lebih jarang dari peringkat 1500 ditunda untuk N1.
  Jumlah 543 adalah HASIL metode ini, bukan target yang ditetapkan di awal.
- **Bacaan/arti:** KANJIDIC2 (EDRDG, CC BY-SA 4.0); transformasi sama
  (ON katakana → hiragana, notasi kamus dibersihkan, maks 3+3).
- **Arti Indonesia:** terjemahan ringkas dari glosarium Inggris KANJIDIC2.
- **Contoh kosakata:** subset JMdict ber-Indonesia milik pengguna (CC BY-SA
  4.0, EDRDG); 373 kanji dapat contoh otomatis, 170 kanji tanpa contoh di
  subset diisi manual dari kosakata standar dengan bacaan terverifikasi
  KANJIDIC2 (didokumentasikan per-batch dalam skrip build).
- **Validasi anti-overlap:** N2 ∩ N5 = ∅, N2 ∩ N4 = ∅, N2 ∩ N3 = ∅
  (otomatis via test; utilitas extensible untuk N1).

## Sumber data N1 (Phase 7, 4 Oktober 2026)

Metodologi seleksi (§3: jumlah dari metode, bukan target arbitrer):

```text
classic KANJIDIC J1 (old JLPT Level 1, 1207 kanji)
→ buang karakter yang sudah ada di N5/N4/N3/N2
→ 652 kandidat
→ filter F ≤ 2500 (masih dalam 2500 kanji paling umum;
   N2 mengambil tier F ≤ 1500, N1 = tier frekuensi berikutnya)
→ 549 kanji final = N1 Study Set
```

- **Alasan J1:** tier tersulit (old JLPT Level 1, EDRDG, CC BY-SA 4.0,
  http://www.edrdg.org/kanjidic/, diambil 4 Oktober 2026).
- **Alasan F ≤ 2500:** study set fokus pada kanji yang masih dijumpai
  dalam bacaan nyata; 103 kanji J1 tanpa F-code/di atas 2500 (sangat
  langka) tidak dimasukkan. Keterbatasan: bukan "semua kanji tersisa" —
  kanji sangat langka dari tier bawah (sisa J2/J3/J4) juga tidak masuk;
  KANJIDIC2 sendiri memuat 13.108 kanji.
- **Bacaan/arti:** KANJIDIC2 (EDRDG, CC BY-SA 4.0); transformasi sama.
- **Arti Indonesia:** terjemahan ringkas dari glosarium Inggris KANJIDIC2.
- **Contoh kosakata:** HANYA dari subset JMdict ber-Indonesia milik pengguna
  (CC BY-SA 4.0, EDRDG) — 188 kanji dapat contoh otomatis; 361 kanji
  dibiarkan TANPA contoh sesuai §8 (lebih baik kosong daripada mengarang
  untuk kanji langka). UI sudah menangani examples kosong.
- **Validasi anti-overlap:** N1 ∩ N5/N4/N3/N2 = ∅ (otomatis via test).

## Kepatuhan lisensi

- KANJIDIC2 dan JMdict berlisensi CC BY-SA 4.0 → atribusi EDRDG wajib
  dicantumkan dan turunan tetap CC BY-SA.
- Tidak ada data dari sumber dengan lisensi tidak jelas.
- Tidak ada data yang dikarang untuk mengisi field kosong.
