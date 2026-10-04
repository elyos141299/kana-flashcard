# CARD-CONTROL.md

Phase 16 — Favorite & Suspend.

## Konsep

Dua kontrol personal per kartu, terpisah penuh dari SRS:

| Aspek | SRS Progress | Card Metadata |
|-------|--------------|---------------|
| Isi | state, interval, dueAt, reviewCount, lapses | favorite, suspended |
| Storage | `kana.progress.v1` | `kana.cardmeta.v1` |
| Diubah queue | tidak | dibaca (filter) |
| Diubah rating | ya | tidak |

Favorite dan Suspend **bukan** state SRS. Tidak ada state machine baru.

## Favorite

- Tombol kecil `☆ Favorite` / `★ Favorite` di bawah kartu (semua mode).
- `aria-pressed` untuk aksesibilitas. Tanpa konfirmasi.
- Tidak memengaruhi: SRS, dueAt, interval, review count, daily counters.
- Queue: hanya menjadi filter saat "Study favorites only" aktif.

## Suspend

- Via `⋯ More` → konfirmasi ringan `Suspend this card? [Cancel] [Suspend]`.
- `suspended = true` → kartu dikecualikan dari **semua** queue
  (New, Learning, Review) selama suspended.
- **Progress SRS tetap utuh**: state, interval, dueAt tidak diubah/dihapus.
- Unsuspend → kartu kembali eligible dengan progress & dueAt sebelumnya
  (tidak direset menjadi NEW, tidak dipaksa masuk sesi).
- Suspend tidak mengembalikan kuota daily yang sudah terpakai.

## Queue behavior

```
if suspended → exclude
else if favoriteOnly && !favorite → exclude
else → klasifikasi normal (Learning due → Review due → New)
```

- Favorite study tetap menghormati SRS: kartu favorite yang belum due
  tidak dipaksa masuk; new favorite boleh masuk jika eligible.
- Favorite ≠ force review. Suspend ≠ delete.

## Favorites & Suspended view

Di halaman Progress: daftar kartu favorite (dengan tombol ★ unfavorite)
dan daftar kartu suspended (dengan tombol Unsuspend).

## Persistence

- Tersimpan di localStorage, survive refresh & close/reopen.
- Ikut export JSON sebagai `cardMetadata`.
- Import memvalidasi struktur; malformed ditolak dan data lama dipertahankan.

## Reset behavior

`Reset progress` menghapus SRS progress + statistik harian,
**tetapi mempertahankan Favorite dan Suspended**.
Dijelaskan di UI Settings.

## UI

- Japanese Minimalism: tombol kecil, tidak memenuhi kartu.
- Native button, aria-label, focus-visible, min touch target 44px.
- Suspend memakai konfirmasi inline (tidak mudah terpencet accident).
