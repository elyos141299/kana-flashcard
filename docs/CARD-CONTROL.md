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

## Study Favorites

Opsi `★ Study favorites only` di Study Setup. Favorite adalah **filter**,
bukan override terhadap SRS.

`Study Favorites` hanya mengambil kartu yang:

```
favorite = true
AND suspended = false
AND eligible menurut aturan queue normal
```

- **NEW**: boleh masuk jika daily new limit masih tersedia.
- **LEARNING**: hanya jika `state = learning AND dueAt <= now`.
- **REVIEW**: hanya jika `state = review AND dueAt <= now`.
- Kartu favorite yang belum due **tidak dipaksa masuk** — tidak mengubah
  dueAt, interval, atau state.
- Priority di dalam Study Favorites tetap: Learning due → Review due → New;
  most overdue first; New mengikuti urutan dataset.
- Daily limits tetap berlaku; favorite tidak mendapat kuota khusus.
- Jika sebagian eligible: session berjalan dengan kartu yang tersedia saja
  (tidak diisi non-favorite, tidak diduplikasi).
- Jika semua favorite belum due → empty state:
  `No favorite cards are due right now.` + waktu review favorite berikutnya
  jika tersedia.

## Non-due favorite tetap terlihat

Favorites View (di Progress) menampilkan **semua** favorite yang tidak
suspended — termasuk yang belum due — dengan status kecil:
`Due / Learning / New / Besok / …`.
Kartu tersebut tidak masuk Study Favorites sampai eligible.

## Suspended favorites

`favorite = true + suspended = true` → tetap favorite dan tersimpan,
tidak masuk Study Favorites maupun queue normal. Setelah unsuspend,
kembali menjadi favorite dan mengikuti aturan due normal.

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
