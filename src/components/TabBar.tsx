export type TabId = "home" | "study" | "reference" | "progress" | "settings";

const TABS: Array<{ id: TabId; jp: string; label: string }> = [
  { id: "home", jp: "家", label: "Home" },
  { id: "study", jp: "学", label: "Study" },
  { id: "reference", jp: "表", label: "Reference" },
  { id: "progress", jp: "歩", label: "Progress" },
  { id: "settings", jp: "設", label: "Settings" },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="tabbar" aria-label="Navigasi utama">
      <div className="tabbar-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            aria-selected={active === t.id}
            onClick={() => onChange(t.id)}
          >
            <span className="tab-jp" aria-hidden="true">{t.jp}</span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
