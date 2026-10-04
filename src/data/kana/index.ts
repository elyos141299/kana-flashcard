/**
 * Akses dataset Kana. UI memakai selectKana() — jangan hard-code list di component.
 */
import type { KanaCard, KanaScript, KanaGroup } from "./types.js";
import { HIRAGANA_ALL } from "./hiragana.js";
import { KATAKANA_ALL } from "./katakana.js";

export * from "./types.js";
export { HIRAGANA_ALL } from "./hiragana.js";
export { KATAKANA_ALL } from "./katakana.js";

export type KanaSelection = KanaGroup | "all";

const BY_SCRIPT: Record<KanaScript, KanaCard[]> = {
  hiragana: HIRAGANA_ALL,
  katakana: KATAKANA_ALL,
};

/**
 * Ambil kartu berdasarkan script + group, urutan deterministic sesuai dataset (§12).
 * group "all" = seluruh group berurutan: basic → dakuten → handakuten → combination → small.
 */
export function selectKana(script: KanaScript, group: KanaSelection): KanaCard[] {
  const all = BY_SCRIPT[script];
  if (group === "all") return [...all];
  return all.filter((c) => c.group === group);
}

/** Jumlah kartu per script+group (untuk UI Progress). */
export function countKana(script: KanaScript, group: KanaSelection): number {
  return selectKana(script, group).length;
}
