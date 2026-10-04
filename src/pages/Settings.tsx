import { useRef, useState } from "react";
import {
  loadSettings,
  saveSettings,
  exportAll,
  importAll,
  resetAll,
} from "../storage/progress.js";
import type { Settings } from "../storage/progress.js";

export function applyTheme(theme: Settings["theme"]) {
  document.documentElement.dataset.theme = theme;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    if (patch.theme) applyTheme(patch.theme);
  };

  const doExport = () => {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kana-flashcard-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = importAll(String(reader.result));
        const orphanInfo =
          result.orphanedProgress + result.orphanedMeta > 0
            ? ` (${result.orphanedProgress + result.orphanedMeta} data lama tidak dikenali, tetap disimpan)`
            : "";
        alert(`Data berhasil diimport.${orphanInfo} Refresh halaman.`);
      } catch (e) {
        alert(e instanceof Error ? e.message : "File tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  const doReset = () => {
    if (confirm("Hapus semua progress belajar? Tindakan ini tidak bisa dibatalkan.")) {
      resetAll();
      alert("Progress dihapus.");
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <p className="section-label">Theme</p>
      <div className="choice-grid">
        {(["light", "dark", "system"] as const).map((t) => (
          <button key={t} className="choice" aria-pressed={settings.theme === t} onClick={() => update({ theme: t })}>
            {t === "light" ? "Terang" : t === "dark" ? "Gelap" : "Sistem"}
          </button>
        ))}
      </div>

      <p className="section-label">Study</p>
      <div className="stat-row">
        <span>Default cards / session</span>
        <span>
          {[10, 20, 30, 50].map((n) => (
            <button
              key={n}
              className="link-btn"
              style={{ fontWeight: settings.defaultCards === n ? 700 : 400, color: settings.defaultCards === n ? "var(--vermilion)" : undefined }}
              onClick={() => update({ defaultCards: n })}
            >
              {n}
            </button>
          ))}
        </span>
      </div>
      <div className="stat-row">
        <span>Daily new cards</span>
        <span>
          {[10, 20, 30, 50, 100].map((n) => (
            <button
              key={n}
              className="link-btn"
              style={{ fontWeight: settings.dailyNewLimit === n ? 700 : 400, color: settings.dailyNewLimit === n ? "var(--vermilion)" : undefined }}
              onClick={() => update({ dailyNewLimit: n })}
            >
              {n}
            </button>
          ))}
        </span>
      </div>
      <div className="stat-row">
        <span>Daily reviews</span>
        <span>
          {[50, 100, 200].map((n) => (
            <button
              key={n}
              className="link-btn"
              style={{ fontWeight: settings.dailyReviewLimit === n ? 700 : 400, color: settings.dailyReviewLimit === n ? "var(--vermilion)" : undefined }}
              onClick={() => update({ dailyReviewLimit: n })}
            >
              {n}
            </button>
          ))}
          <button
            className="link-btn"
            style={{ fontWeight: settings.dailyReviewLimit === 0 ? 700 : 400, color: settings.dailyReviewLimit === 0 ? "var(--vermilion)" : undefined }}
            onClick={() => update({ dailyReviewLimit: 0 })}
          >
            Tanpa batas
          </button>
        </span>
      </div>

      <hr className="divider" />

      <p className="section-label">Data</p>
      <div className="btn-row" style={{ flexDirection: "column" }}>
        <button className="btn" onClick={doExport}>Export progress (JSON)</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Import progress</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
          }}
        />
        <button className="btn" style={{ color: "var(--vermilion)", borderColor: "var(--vermilion)" }} onClick={doReset}>
          Reset progress
        </button>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 8 }}>
          Reset menghapus progress belajar dan statistik harian.
          Favorite dan Suspended tetap tersimpan.
        </p>
      </div>

      <hr className="divider" />
      <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
        Kana Flashcards · MVP fondasi · v0.1.0
      </p>
    </div>
  );
}
