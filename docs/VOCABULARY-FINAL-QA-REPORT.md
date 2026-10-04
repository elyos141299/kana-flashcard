# N5 VOCABULARY — FINAL QA REPORT

Tanggal: 4 Oktober 2026
Status dataset: `vocab-n5@0.5.0` LOCKED (500 entry)
Status runtime: FEATURE COMPLETE
Production: BELUM di-push

---

## AUTOMATED VERIFICATION

| Check | Result |
|---|---|
| Tests | **383/383 PASS** |
| Build (tsc + vite) | **PASS** |
| Lint | **0 errors**, 1 warning (pre-existing) |
| Production bundle | **PASS** (dist generated) |
| Extractor regression | 17/17 PASS |
| Semantic regression | PASS |
| Baseline integrity | 397/397 identik |
| Dataset validator | 0 error |

---

## MANUAL QA STATUS

| Area | Status |
|---|---|
| Desktop Chrome | ⏳ PENDING (checklist siap) |
| Edge | ⏳ PENDING (checklist siap) |
| iPhone Safari | ⏳ PENDING (checklist siap) |
| PWA | ⏳ PENDING (checklist siap) |
| Offline | ⏳ PENDING (checklist siap) |
| Visual | ⏳ PENDING (checklist siap) |
| Audio (real device) | ⏳ PENDING |
| Typing (real keyboard) | ⏳ PENDING |
| Export/import (real) | ⏳ PENDING |

Checklist lengkap: `docs/VOCABULARY-QA-CHECKLIST.md`

---

## KNOWN LIMITATIONS

1. Example coverage 11.2% (Tier A 100%)
2. Typing Recall: prompt memakai meaning pertama untuk multiple meanings
3. Audio TTS offline tergantung voice ter-install di perangkat
4. Hanya N5 (500 entry); N4/N3 belum ada
5. Mixed Study belum mencakup vocabulary

---

## REGRESSION NOTES

- Tidak ada perubahan pada SRS engine
- Tidak ada perubahan pada Study History system
- Tidak ada perubahan schema export/import
- Tidak ada perubahan dataset locked
- Semua perubahan additive

---

`N5 VOCABULARY — READY FOR REAL DEVICE VERIFICATION`

Menunggu testing perangkat nyata sebelum production push.
