# REAL-DEVICE-QA.md

Checklist pengujian pada perangkat nyata. Production URL:
`https://elyos141299.github.io/kana-flashcard/`

**Jangan mengklaim PASS untuk item yang belum benar-benar dijalankan
pada perangkat nyata.**

## Windows — Chrome / Edge

- [ ] Buka production URL — Home tampil tanpa error
- [ ] Study → pilih Hiragana → Recognition → 10 kartu → Start
- [ ] Flashcard: depan hanya karakter → tap/Enter untuk reveal
- [ ] Audio: tekan Putar → terdengar bahasa Jepang → tekan Next → audio berhenti
- [ ] Rating: Again/Hard/Good/Easy — satu klik = satu rating
- [ ] Progress: angka bertambah setelah sesi
- [ ] Settings: ganti theme Terang/Gelap/Sistem
- [ ] Settings: Export → Reset → Import → progress kembali
- [ ] Refresh browser → progress tetap ada
- [ ] Resize jendela (sempit ↔ lebar) — tidak ada horizontal overflow
- [ ] Navigasi keyboard: Tab mencapai semua tombol, focus terlihat
- [ ] (Opsional) Install sebagai PWA via menu browser

## iPhone — Safari

- [ ] Buka production URL portrait — layout rapi
- [ ] Study → flashcard → reveal → rating — semua mudah disentuh
- [ ] Safe area: tidak ada konten tertutup notch/home indicator
- [ ] Tidak ada horizontal overflow
- [ ] Audio: tekan Putar → suara Jepang keluar (cek mute switch!)
- [ ] Share → Add to Home Screen → ikon terpasang
- [ ] Buka dari ikon Home Screen — tampil standalone (tanpa address bar)
- [ ] Navigasi tab, flashcard, dan Progress bekerja dalam mode standalone

## Offline

- [ ] Buka aplikasi saat online, kunjungi Home/Study/Progress/Settings
- [ ] Matikan internet (airplane mode / disconnect WiFi)
- [ ] Reload aplikasi — app shell tetap terbuka
- [ ] Flashcard tetap bisa dipelajari offline
- [ ] Progress tersimpan lokal dan tetap ada
- [ ] Nyalakan internet kembali — tidak ada error

## Hasil

| Tanggal | Perangkat | Penguji | Catatan |
|---------|-----------|---------|---------|
|         |           |         |         |
