import { useEffect, useState } from "react";
import { TabBar } from "./components/TabBar.js";
import type { TabId } from "./components/TabBar.js";
import { Home } from "./pages/Home.js";
import { Study } from "./pages/Study.js";
import { Progress } from "./pages/Progress.js";
import { SettingsPage, applyTheme } from "./pages/Settings.js";
import { loadSettings } from "./storage/progress.js";
import { ensureMigrated } from "./storage/migrate.js";
import "./styles/tokens.css";
import "./styles/app.css";

export default function App() {
  const [tab, setTab] = useState<TabId>("home");

  useEffect(() => {
    // Migration check — sekali saat startup, bukan tiap render.
    try {
      ensureMigrated();
    } catch {
      // migration gagal → data dikembalikan ke backup oleh runMigrations
    }
    applyTheme(loadSettings().theme);
  }, []);

  return (
    <div className="app">
      {tab === "home" && <Home go={setTab} />}
      {tab === "study" && <Study />}
      {tab === "progress" && <Progress />}
      {tab === "settings" && <SettingsPage />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
