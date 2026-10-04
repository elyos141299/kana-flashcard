# DATA-STORAGE.md

Phase 19 — skema storage, versioning, migration.

## Storage keys

| Key | Isi | Schema |
|-----|-----|--------|
| `kana.progress.v1` | `Record<cardId, CardProgress>` | SRS per kartu: state, interval, dueAt, reviewCount, lapses, ease, learningStep |
| `kana.stats.v1` | `Stats` | `{ days: Record<dateKey, DayStats>, streak, lastActiveDate }` |
| `kana.settings.v1` | `Settings` | theme, defaultCards, dailyNewLimit, dailyReviewLimit |
| `kana.cardmeta.v1` | `Record<cardId, {favorite, suspended}>` | metadata personal (Phase 16) |
| `kana.schema.version` | `number` | schema version (Phase 19) |

Semua di localStorage. Tidak ada backend, tidak ada upload.

## Schema version

- `CURRENT_SCHEMA_VERSION = 1` (baseline).
- v0 = instalasi pre-versioning → diadopsi sebagai v1 tanpa perubahan data.
- v > CURRENT (masa depan) → tidak disentuh.

## Migration strategy

```
ensureMigrated()  [sekali saat app startup]
  → v0 → set v1 (adopsi)
  → v < CURRENT → runMigrations(MIGRATIONS, v)
  → v > CURRENT → diam
```

- `MIGRATIONS`: daftar step `{from, to, up}` berurutan. Kosong untuk v1.
- Sebelum migrasi: `snapshotStorage()` (semua managed keys).
- Jika step gagal / tidak ditemukan: `restoreStorage(backup)` → throw.
- Migration TIDAK mengubah nilai SRS kecuali step khusus membutuhkannya.
- Migration mempertahankan favorite, suspended, stats historis, settings
  (field baru → default aman).

## Reset behavior

`Reset Progress` menghapus `kana.progress.v1` + `kana.stats.v1`.
Mempertahankan: `kana.cardmeta.v1` (favorite/suspend), settings,
schema version.

## Backup retention

Backup internal hanya hidup selama operasi migration/import.
Setelah sukses → dibersihkan (tidak disimpan permanen).
Tidak ada backup tak terbatas.

## Orphan handling

Card ID yang tidak ada di dataset (mis. card dihapus di masa depan):
data **dipertahankan**, hanya dilaporkan jumlahnya
(`findOrphanedCardIds`). Tidak dihapus diam-diam, tidak ada error ke user.

## Performance

- Migration hanya saat startup (version berbeda) atau import.
- Tidak ada pemrosesan dataset per render untuk versioning.
