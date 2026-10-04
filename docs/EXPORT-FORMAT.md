# EXPORT-FORMAT.md

Phase 19 — format file export/import JSON.

## Struktur

```jsonc
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2026-10-04T12:00:00.000Z",
  "progress": {
    "<cardId>": {
      "cardId": "<cardId>",
      "state": "new | learning | review",
      "interval": 4,
      "dueAt": "2026-10-10T00:00:00.000Z",
      "reviewCount": 3,
      "lapses": 1
      // + field internal SRS lain (ease, learningStep, ...)
    }
  },
  "stats": {
    "days": {
      "2026-10-04": {
        "newCards": 5, "reviewCards": 8, "learningCards": 2,
        "reviewed": 15, "again": 1, "hard": 2, "good": 9, "easy": 3
      }
    },
    "streak": 7,
    "lastActiveDate": "2026-10-04"
  },
  "settings": {
    "theme": "system",
    "defaultCards": 20,
    "dailyNewLimit": 20,
    "dailyReviewLimit": 100
  },
  "cardMetadata": {
    "<cardId>": { "favorite": true, "suspended": false }
  }
}
```

## Import rules

1. Parse JSON — gagal → error, data current utuh.
2. `schemaVersion` hilang → dianggap v1 (export lama tetap didukung).
3. `schemaVersion` > versi aplikasi → error:
   `Backup ini memakai schema vX yang tidak didukung.`
   Data current **tidak diubah**.
4. Validasi **seluruh** section dulu (progress, stats, settings,
   cardMetadata) — ada yang invalid → error, tanpa partial write.
5. Backup current → tulis semua → gagal di tengah → restore backup.
6. Card ID unknown (orphan) → **dipertahankan**, dilaporkan jumlahnya
   di hasil import. Tidak dihapus diam-diam.
7. Settings: field hilang → default aman; field tak dikenal → diabaikan.

Import mengembalikan `{ ok, migrated, orphanedProgress, orphanedMeta }`.
