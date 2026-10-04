# Definisi Level Kanji

## Aturan utama

Setiap level Kanji merepresentasikan **new study set** — kumpulan kanji BARU
untuk level tersebut, BUKAN ulangan level sebelumnya.

```text
N5 = 114 kanji pada N5 Study Set
N4 = 168 kanji BARU pada N4 Study Set (tidak mengandung ulang N5)
N3 = 350 kanji BARU pada N3 Study Set (tidak mengandung ulang N5/N4)
N2 = 543 kanji BARU pada N2 Study Set (tidak mengandung ulang N5/N4/N3)
N1 = 549 kanji BARU pada N1 Study Set (tidak mengandung ulang N5/N4/N3/N2)
...
```

Validasi otomatis: setiap pasangan level dicek `∩ = ∅` (test FAIL bila
ada overlap). Utilitas test dirancang agar mudah ditambah N2/N1.

## Mengapa tidak cumulative?

SRS menangani review setiap kartu secara independen berdasarkan ID kartu.
Kartu N5 yang sudah dipelajari tetap direview sesuai jadwalnya sendiri;
tidak perlu dimasukkan ulang ke dataset N4.

Jika suatu saat dibutuhkan mode "Cumulative" (belajar N5+N4 sekaligus),
itu adalah fitur terpisah — bukan perubahan dataset.

## Penamaan

Gunakan istilah "N5 Study Set" / "N4 Study Set". JLPT tidak menerbitkan
daftar resmi kanji per level, jadi jangan pernah menyebut dataset ini
"official JLPT list". Di UI boleh tampil "Kanji N5" / "Kanji N4" sebagai
penanda tingkat kesulitan.
