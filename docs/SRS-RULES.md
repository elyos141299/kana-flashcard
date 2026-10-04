# SRS RULES — sumber: brief user 4 Okt 2026

Sistem spaced repetition sederhana, 3 state: NEW -> LEARNING -> REVIEW.
MATURE bukan state terpisah: kartu dianggap mature jika state=review dan interval >= 21 hari.

## Kartu baru
| Rating | Hasil |
|--------|-------|
| Again  | LEARNING, due +1 menit |
| Hard   | LEARNING, due +5 menit |
| Good   | LEARNING, due +10 menit |
| Easy   | REVIEW, interval 4 hari |

## Learning steps (menit): [1, 5, 10]
- Again -> kembali ke step 1 menit
- Hard  -> tetap di learning, due +5 menit dari sekarang
- Good  -> naik satu step; Good di step terakhir = graduate -> REVIEW interval 1 hari
- Easy  -> langsung graduate -> REVIEW interval 4 hari

> Dikonfirmasi user 4 Okt 2026: learning steps HANYA 3 tahap (1m, 5m, 10m).
> "1 day" adalah interval review pertama setelah graduate, BUKAN learning step ke-4.
> Jangan ubah menjadi 4 tahap.

## Kartu review (interval = N hari)
- Again -> lapse: LEARNING +10 menit. Saat graduate lagi: interval = max(round(N x 0.3), 1 hari)
- Hard  -> max(round(N x 1.2), N + 1 hari)
- Good  -> round(N x 2.5)
- Easy  -> round(N x 4)

## Batas
- Interval min 1 hari, max 365 hari. Disimpan sebagai integer (round).
- dueAt = timestamp UTC (ISO). Kartu due jika dueAt <= now.

## Prioritas sesi
1. Learning cards yang due
2. Review cards yang due (paling overdue dulu)
3. New cards (urutan dataset, deterministic)

## Limit harian
- New cards: default 20/hari (pilihan 10/20/30/50/100), bisa diubah di Settings
- Review: default 100/hari (pilihan 50/100/200/tanpa limit)

## Implementasi
- `src/srs/` terpisah dari UI. UI hanya memanggil `rateCard(progress, cardId, rating, now?)`.
- Content (data/) terpisah dari progress user (storage/).
- Unit test: `npm test` (vitest).
