/**
 * Reference Tables — LOOKUP / REFERENCE, bukan study session.
 *
 * Prinsip: READ-ONLY terhadap learning state. Membuka reference,
 * melihat row, atau play audio TIDAK mengubah SRS/progress/history/favorite.
 *
 * Data langsung dari existing dataset (tidak ada duplicate):
 * - Kana: src/data/kana/
 * - Kanji: src/data/kanji/
 * - Vocabulary: src/data/vocab/
 */
import { useMemo, useState } from "react";
import type { KanaCard, KanaScript } from "../data/kana/index.js";
import { KANA_GROUPS, GROUP_LABELS } from "../data/kana/index.js";
import { selectKana } from "../data/kana/index.js";
import type { KanjiLevel } from "../data/kanji/index.js";
import { selectKanji } from "../data/kanji/index.js";
import type { VocabLevel } from "../data/vocab/index.js";
import { selectVocab, VOCAB_LEVELS } from "../data/vocab/index.js";
import { AudioButton } from "../components/AudioButton.js";

type RefSection = "kana" | "kanji" | "vocabulary";

const KANJI_REF_LEVELS: KanjiLevel[] = ["N5", "N4", "N3"];

export function Reference() {
  const [section, setSection] = useState<RefSection>("kana");
  const [kanaScript, setKanaScript] = useState<KanaScript>("hiragana");
  const [kanjiLevel, setKanjiLevel] = useState<KanjiLevel>("N5");
  const [vocabLevel, setVocabLevel] = useState<VocabLevel>("N5");
  const [query, setQuery] = useState("");

  return (
    <div className="page">
      <h1 className="page-title">表 Reference</h1>
      <p className="page-subtitle">Tabel referensi — bukan sesi belajar. Tidak mengubah progress.</p>

      {/* Section tabs */}
      <div className="ref-tabs" role="tablist" aria-label="Kategori referensi">
        {(["kana", "kanji", "vocabulary"] as RefSection[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={section === s}
            className={`ref-tab${section === s ? " active" : ""}`}
            onClick={() => { setSection(s); setQuery(""); }}
          >
            {s === "kana" ? "Kana" : s === "kanji" ? "Kanji" : "Vocabulary"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="ref-search">
        <label htmlFor="ref-search-input" className="sr-only">Cari</label>
        <input
          id="ref-search-input"
          type="search"
          placeholder={
            section === "kana" ? "Cari kana atau romaji…" :
            section === "kanji" ? "Cari kanji, reading, atau arti…" :
            "Cari kata, reading, atau arti Indonesia…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ref-search-input"
        />
      </div>

      {section === "kana" && (
        <KanaReference
          script={kanaScript}
          onScriptChange={setKanaScript}
          query={query}
        />
      )}
      {section === "kanji" && (
        <KanjiReference
          level={kanjiLevel}
          onLevelChange={setKanjiLevel}
          query={query}
        />
      )}
      {section === "vocabulary" && (
        <VocabReference
          level={vocabLevel}
          onLevelChange={setVocabLevel}
          query={query}
        />
      )}
    </div>
  );
}

/* ============ KANA ============ */

function KanaReference({
  script,
  onScriptChange,
  query,
}: {
  script: KanaScript;
  onScriptChange: (s: KanaScript) => void;
  query: string;
}) {
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return KANA_GROUPS.map((group) => {
      const cards = selectKana(script, group).filter((c) => {
        if (!q) return true;
        return (
          c.character.includes(query.trim()) ||
          c.romaji.toLowerCase().includes(q)
        );
      });
      return { group, cards };
    }).filter((g) => g.cards.length > 0);
  }, [script, query]);

  return (
    <div>
      <div className="ref-subtabs" role="tablist" aria-label="Script kana">
        {(["hiragana", "katakana"] as KanaScript[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={script === s}
            className={`ref-subtab script-${s}${script === s ? " active" : ""}`}
            onClick={() => onScriptChange(s)}
          >
            <span aria-hidden="true">{s === "hiragana" ? "ひ" : "カ"}</span>
            {" "}{s === "hiragana" ? "Hiragana" : "Katakana"}
          </button>
        ))}
      </div>

      {groups.map(({ group, cards }) => (
        <section key={group} aria-labelledby={`kana-group-${group}`}>
          <h2 id={`kana-group-${group}`} className="ref-group-title">
            {GROUP_LABELS[group]}
          </h2>
          <div className="kana-grid" role="grid" aria-label={`${script} ${GROUP_LABELS[group]}`}>
            {cards.map((card) => (
              <KanaCell key={card.id} card={card} />
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="ref-empty">Tidak ditemukan.</p>
      )}
    </div>
  );
}

function KanaCell({ card }: { card: KanaCard }) {
  const speakText = card.character;
  return (
    <div className="kana-cell" role="gridcell" aria-label={`${card.script === "hiragana" ? "Hiragana" : "Katakana"} ${card.romaji}`}>
      <span className="kana-char">{card.character}</span>
      <span className="kana-romaji">{card.romaji || "—"}</span>
      <AudioButton
        text={speakText}
        label={`Dengarkan ${card.character}`}
        size="sm"
      />
    </div>
  );
}

/* ============ KANJI ============ */

function KanjiReference({
  level,
  onLevelChange,
  query,
}: {
  level: KanjiLevel;
  onLevelChange: (l: KanjiLevel) => void;
  query: string;
}) {
  const q = query.trim().toLowerCase();

  const cards = useMemo(() => {
    const all = selectKanji(level);
    if (!q) return all;
    const nq = query.trim().normalize("NFC");
    return all.filter((c) => {
      if (c.character.includes(nq)) return true;
      const readings = [...c.onyomi, ...c.kunyomi, ...c.commonReadings];
      if (readings.some((r) => r.includes(nq))) return true;
      if (c.meanings.some((m) => m.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [level, query]);

  return (
    <div>
      <div className="ref-subtabs" role="tablist" aria-label="Level kanji">
        {KANJI_REF_LEVELS.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={level === l}
            className={`ref-subtab${level === l ? " active" : ""}`}
            onClick={() => onLevelChange(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="ref-table-wrapper">
        <table className="ref-table" aria-label={`Kanji ${level}`}>
          <thead>
            <tr>
              <th scope="col">No</th>
              <th scope="col">Arti</th>
              <th scope="col">Kanji</th>
              <th scope="col">Onyomi</th>
              <th scope="col">Kunyomi</th>
              <th scope="col">Contoh</th>
              <th scope="col"><span className="sr-only">Audio</span></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, idx) => (
              <tr key={card.id}>
                <td className="ref-td-num">{idx + 1}</td>
                <td>{card.meanings.join(", ")}</td>
                <td className="ref-td-kanji">{card.character}</td>
                <td>{card.onyomi.join("、") || "—"}</td>
                <td>{card.kunyomi.join("、") || "—"}</td>
                <td className="ref-td-examples">
                  {card.examples.map((ex, i) => (
                    <div key={i} className="ref-table-example">
                      {ex.word} ({ex.reading}): {ex.meaning}
                    </div>
                  ))}
                </td>
                <td>
                  <AudioButton
                    text={card.commonReadings[0] ?? card.character}
                    label={`Dengarkan ${card.character}`}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cards.length === 0 && (
        <p className="ref-empty">Tidak ditemukan.</p>
      )}
    </div>
  );
}

/* ============ VOCABULARY ============ */

function VocabReference({
  level,
  onLevelChange,
  query,
}: {
  level: VocabLevel;
  onLevelChange: (l: VocabLevel) => void;
  query: string;
}) {
  // Hanya tampilkan level yang ada datanya
  const availableLevels = useMemo(() => {
    return VOCAB_LEVELS.filter((l) => selectVocab(l).length > 0);
  }, []);

  const q = query.trim().toLowerCase();

  const cards = useMemo(() => {
    const all = selectVocab(level);
    if (!q) return all;
    const nq = query.trim().normalize("NFC");
    return all.filter((c) => {
      if (c.word.includes(nq)) return true;
      if (c.kanaForm && c.kanaForm.includes(nq)) return true;
      const readings = [c.reading, ...(c.readings ?? [])];
      if (readings.some((r) => r.includes(nq))) return true;
      if (c.meanings.some((m) => m.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [level, query]);

  return (
    <div>
      <div className="ref-subtabs" role="tablist" aria-label="Level vocabulary">
        {availableLevels.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={level === l}
            className={`ref-subtab${level === l ? " active" : ""}`}
            onClick={() => onLevelChange(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="ref-table-wrapper">
        <table className="ref-table" aria-label={`Vocabulary ${level}`}>
          <thead>
            <tr>
              <th scope="col">No</th>
              <th scope="col">Kata</th>
              <th scope="col">Reading</th>
              <th scope="col">Arti</th>
              <th scope="col">Kategori</th>
              <th scope="col">Contoh</th>
              <th scope="col"><span className="sr-only">Audio</span></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, idx) => {
              const displayReading = card.primaryReading ?? card.reading;
              const altReadings = (card.readings ?? []).filter((r) => r !== displayReading);
              return (
                <tr key={card.id}>
                  <td className="ref-td-num">{idx + 1}</td>
                  <td className="ref-td-kanji">
                    {card.word}
                    {card.kanaForm && card.kanaForm !== card.word && (
                      <div className="ref-td-kana">{card.kanaForm}</div>
                    )}
                  </td>
                  <td>
                    {displayReading}
                    {altReadings.length > 0 && (
                      <div className="ref-alt-reading">{altReadings.join("、")}</div>
                    )}
                  </td>
                  <td>{card.meanings.join("; ")}</td>
                  <td className="ref-td-meta">{card.learningCategory}</td>
                  <td className="ref-td-examples">
                    {(card.examples ?? []).map((ex, i) => (
                      <div key={i} className="ref-table-example">
                        <div>{ex.sentence}</div>
                        <div className="ref-example-reading">{ex.usedReading ?? ex.reading}</div>
                        <div>{ex.meaning}</div>
                      </div>
                    ))}
                  </td>
                  <td>
                    <AudioButton
                      text={displayReading}
                      label={`Dengarkan ${card.word}`}
                      size="sm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cards.length === 0 && (
        <p className="ref-empty">Tidak ditemukan.</p>
      )}

      <p className="ref-count">{cards.length} kata</p>
    </div>
  );
}
