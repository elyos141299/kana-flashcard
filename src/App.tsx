import { useEffect, useState } from "react";
import { TabBar } from "./components/TabBar.js";
import type { TabId } from "./components/TabBar.js";
import { Home } from "./pages/Home.js";
import { Study } from "./pages/Study.js";
import { Progress } from "./pages/Progress.js";
import { SettingsPage, applyTheme } from "./pages/Settings.js";
import { loadSettings } from "./storage/progress.js";
import "./styles/tokens.css";
import "./styles/app.css";

export default function App() {
  const [tab, setTab] = useState<TabId>("home");

  useEffect(() => {
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
