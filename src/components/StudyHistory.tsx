/**
 * Study History (Phase 24) — visualisasi aktivitas belajar harian.
 * Hanya membaca Stats existing; tidak ada storage baru, tidak ada
 * algoritma pembelajaran baru.
 */
import { useMemo, useState } from "react";
import type { DayStats } from "../storage/progress.js";
import {
  buildDateKeys,
  fromKey,
  mondayIndex,
  prettyDate,
  rangeLabel,
  toKey,
  weekdayName,
  WEEKDAY_SHORT,
  type HistoryRange,
} from "../history/dates.js";
import { HISTORY_RANGES } from "../history/dates.js";

/** Level intensitas heatmap dari jumlah kartu dipelajari. */
function heatLevel(total: number): 0 | 1 | 2 | 3 | 4 {
  if (total <= 0) return 0;
  if (total < 5) return 1;
  if (total < 15) return 2;
  if (total < 30) return 3;
  return 4;
}

function dayTotal(day?: DayStats): number {
  return day?.reviewed ?? 0;
}

export function StudyHistory({ days }: { days: Record<string, DayStats> }) {
  const [range, setRange] = useState<HistoryRange>(30);
  const [today] = useState(() => toKey(new Date()));
  const [selected, setSelected] = useState<string>(today);

  const keys = useMemo(() => buildDateKeys(range, days), [range, days]);

  // Sel terpilih harus ada di range saat ini; kalau tidak, pakai hari ini / terakhir.
  const activeKey = keys.includes(selected)
    ? selected
    : (keys.includes(today) ? today : keys[keys.length - 1] ?? today);

  const totalInRange = useMemo(
    () => keys.reduce((s, k) => s + dayTotal(days[k]), 0),
    [keys, days],
  );

  // Penyelarasan kalender: sel kosong sebelum tanggal pertama (Senin dulu).
  const leadBlanks = useMemo(() => {
    const first = keys[0] ? fromKey(keys[0]) : null;
    return first ? mondayIndex(first) : 0;
  }, [keys]);

  const active = days[activeKey];
  const activeTotal = dayTotal(active);

  return (
    <div>
      {/* Range selector */}
      <div className="segmented" role="group" aria-label="Rentang riwayat belajar">
        {HISTORY_RANGES.map((r) => (
          <button
            key={String(r)}
            type="button"
            className={`segmented-btn${range === r ? " is-active" : ""}`}
            aria-pressed={range === r}
            onClick={() => setRange(r)}
          >
            {rangeLabel(r)}
          </button>
        ))}
      </div>

      {keys.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
          Belum ada aktivitas belajar yang tercatat.
        </p>
      ) : (
        <>
          {/* Heatmap */}
          <div
            role="group"
            aria-label={`Aktivitas belajar ${rangeLabel(range).toLowerCase()} — pilih tanggal untuk detail`}
            className="heat-grid"
          >
            {WEEKDAY_SHORT.map((w) => (
              <span key={w} className="heat-weekday" aria-hidden="true">
                {w}
              </span>
            ))}
            {Array.from({ length: leadBlanks }).map((_, i) => (
              <span key={`blank-${i}`} aria-hidden="true" />
            ))}
            {keys.map((k) => {
              const t = dayTotal(days[k]);
              const isActive = k === activeKey;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${weekdayName(k)}, ${prettyDate(k)}: ${t} kartu dipelajari`}
                  title={`${prettyDate(k)} — ${t} kartu`}
                  className={`heat-cell heat-${heatLevel(t)}${isActive ? " is-selected" : ""}`}
                  onClick={() => setSelected(k)}
                />
              );
            })}
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "8px 0 0" }}>
            {totalInRange} kartu dipelajari
            {range === "all" ? " total" : ` dalam ${rangeLabel(range).toLowerCase()}`}
            {" · "}ketuk tanggal untuk detail
          </p>

          {/* Daily summary */}
          <div style={{ marginTop: 14 }}>
            <p className="section-label" style={{ marginBottom: 2 }}>
              {weekdayName(activeKey)}, {prettyDate(activeKey)}
            </p>
            {activeTotal === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "8px 0" }}>
                No study activity
              </p>
            ) : (
              <>
                <div className="summary-big" style={{ fontSize: 36 }}>
                  {activeTotal}
                </div>
                <p style={{ color: "var(--ink-soft)", marginTop: 0, fontSize: 14 }}>
                  cards studied
                </p>
                <div className="stat-row">
                  <span>New</span>
                  <span className="stat-val">{active?.newCards ?? 0}</span>
                </div>
                <div className="stat-row">
                  <span>Learning</span>
                  <span className="stat-val">{active?.learningCards ?? 0}</span>
                </div>
                <div className="stat-row">
                  <span>Review</span>
                  <span className="stat-val">{active?.reviewCards ?? 0}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
