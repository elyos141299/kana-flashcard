# MIXED-STUDY.md

Phase 18 — Mixed Study Sessions.

## Konsep

Mixed Study hanya mengubah **sumber kartu** untuk membangun session queue.
SRS, cardId, progress, limits, favorite/suspend, mode, audio: tidak berubah.

## Selection

Study Setup → Study Source: `Single Set` (default) / `Mixed Study`.

Mixed:

```
Kana
[ ] Hiragana (113)
[ ] Katakana (113)

Kanji
[ ] N5 (114) … [ ] N1 (549)
```

- Native checkbox, keyboard accessible.
- Start disabled jika belum ada yang dipilih + hint `Select at least one study set.`
- Pindah ke Mixed mem-preselect set yang aktif di single mode.

## Merged pool

```
selected sets
→ merge (urutan tetap: hiragana → katakana → N5 → N4 → N3 → N2 → N1)
→ deduplicate by cardId
→ classify → queue
```

- Dedup by `cardId`, bukan character (し ≠ シ).
- Pool berisi reference kartu yang sama — tidak ada deep clone dataset.
- Deterministic: input sama → urutan sama.
- NEW cards mengikuti urutan dataset masing-masing set.

## SRS priority

Queue existing tetap menjadi authority:

```
Learning due → Review due → New
```

- Most overdue first, **global** lintas dataset (tidak ada priority per level).
- Tidak ada quota/balance per dataset — SRS priority tidak diganggu.

## Daily limits

Global untuk seluruh pool:

- New limit: satu pool (bukan 20 per set).
- Review limit: satu pool; learning due tetap bypass review limit (existing).

## Favorite / Suspended

- Suspended: excluded (di semua set).
- Favorite: tidak mendapat priority khusus.
- Study Favorites + Mixed: `favorite && !suspended && selected dataset &&
  eligible normal` (aturan Phase 16 tetap berlaku).

## Mode

Dipilih sekali per sesi (Recognition / Recall / Typing Recall) —
berlaku untuk semua kartu. Tidak ada randomize per kartu.

## Session UI

- Header: `Mixed Study · Recall` (ringkas, bukan daftar set).
- Session Complete: label `Mixed Study` + ringkasan existing.
- Progress tetap per kartu individual — Mixed Study bukan dataset.

## Persistence

Selection mixed hanya transient UI state — tidak disimpan permanen.

## Performance

- Pool dibangun dari reference; queue satu pass seperti biasa.
- Bundle: JS ~770 KB raw / ~190 KB gzip (naik kecil dari Phase 17, wajar).
