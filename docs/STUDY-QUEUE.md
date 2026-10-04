# STUDY-QUEUE.md

## Smart Study Queue (Phase 12)

Queue mengatur **kartu mana** yang muncul dalam sesi, **kapan**, dan
**prioritas** antar kategori. SRS engine TIDAK diubah — queue hanya memakai
`state` / `dueAt` dari scheduler.

## Card categories

Setiap kartu diklasifikasikan saat sesi dibuat (hanya tiga kategori):

```
NEW      = belum pernah dipelajari (tanpa progress / state "new")
LEARNING = sedang dipelajari (state "learning")
REVIEW   = sudah graduate (state "review")
```

LEARNING tidak pernah dihitung sebagai NEW atau REVIEW.

## Priority

```
Priority 1 — Learning due   (dueAt <= now, paling overdue dulu)
Priority 2 — Review due      (dueAt <= now, paling overdue dulu)
Priority 3 — New             (urutan dataset, kena daily limit)
```

Contoh sesi 20 dengan 3 learning due + 10 review due:

```
3 Learning → 10 Review → 7 New
```

## Ordering (deterministic)

- Learning/Review due: `dueAt` ascending (paling overdue dulu),
  tie-break `cardId`. Tidak random, tidak bergantung urutan object JS.
- New: urutan dataset (あいうえお… / urutan kanji yang ditentukan).

## Daily limits

- New: default 20/hari (pengaturan: 10/20/30/50/100).
- Review: default 100/hari (pengaturan: 50/100/200/tanpa batas).
- Learning due SELALU boleh muncul walau review limit tercapai.

Limit dihitung dari kartu yang **benar-benar dinilai** (bukan yang masuk queue).

## Daily counters

Disimpan per tanggal kalender lokal (`YYYY-MM-DD`), otomatis reset saat
hari berganti (midnight rollover):

```ts
{ date, newCards, reviewCards, learningCards }
```

## Session composition

```
actual = min(requested, availableWithinLimits)
```

Jika tidak ada kartu yang tersedia → empty state:

```
Semua sudah selesai.
Tidak ada kartu yang jatuh tempo saat ini.
Review berikutnya: Besok / 3 jam lagi
```

## Overdue handling

Review/learning yang paling overdue tampil paling dulu. Kartu yang
melebihi daily review limit tetap due (tidak dihapus/ditunda paksa).

## Same-session learning

- Kartu NEW yang dinilai Again → LEARNING, boleh kembali di sesi yang sama
  (maks 2x, di akhir antrian — tidak berturut-turut).
- Kartu REVIEW yang dinilai Again → diperlakukan sebagai LEARNING
  setelah rating (bukan REVIEW lagi).
- Satu `cardId` tetap satu progress record.

## Date handling

Tanggal kalender lokal perangkat (`todayKey()`), format `YYYY-MM-DD`.
Tidak ada timezone hard-coded, tidak ada timezone selector.
