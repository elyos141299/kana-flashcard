/**
 * Card metadata (Phase 16): favorite & suspend.
 *
 * TERPISAH dari SRS progress. Bukan state machine SRS — hanya marker personal.
 * - favorite: kartu penting/pribadi.
 * - suspended: kartu dikecualikan dari study queue (progress SRS tetap utuh).
 *
 * Reset Progress TIDAK menghapus metadata ini.
 */
import { read, write, META_KEY } from "./kv.js";

export interface CardMeta {
  favorite: boolean;
  suspended: boolean;
}

const EMPTY: CardMeta = { favorite: false, suspended: false };

export function loadCardMeta(): Record<string, CardMeta> {
  return read<Record<string, CardMeta>>(META_KEY, {});
}

export function saveCardMeta(meta: Record<string, CardMeta>): void {
  write(META_KEY, meta);
}

export function getCardMeta(cardId: string): CardMeta {
  const meta = loadCardMeta()[cardId];
  return meta ? { ...EMPTY, ...meta } : { ...EMPTY };
}

/** Toggle favorite; return nilai baru. */
export function toggleFavorite(cardId: string): boolean {
  const all = loadCardMeta();
  const next = !getCardMeta(cardId).favorite;
  all[cardId] = { ...getCardMeta(cardId), favorite: next };
  saveCardMeta(all);
  return next;
}

export function setSuspended(cardId: string, suspended: boolean): void {
  const all = loadCardMeta();
  all[cardId] = { ...getCardMeta(cardId), suspended };
  saveCardMeta(all);
}

/** Validasi struktur metadata untuk import — malformed ditolak (null). */
export function validateCardMeta(data: unknown): Record<string, CardMeta> | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const out: Record<string, CardMeta> = {};
  for (const [id, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof v !== "object" || v === null) return null;
    const rec = v as Record<string, unknown>;
    if (typeof rec.favorite !== "boolean" || typeof rec.suspended !== "boolean") {
      return null;
    }
    out[id] = { favorite: rec.favorite, suspended: rec.suspended };
  }
  return out;
}
