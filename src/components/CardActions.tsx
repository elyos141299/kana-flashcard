import { useState } from "react";
import { getCardMeta, toggleFavorite, setSuspended } from "../storage/cardMeta.js";

/**
 * CardActions (Phase 16): kontrol personal per kartu.
 * - ☆ Favorite: marker personal, tidak memengaruhi SRS.
 * - ⋯ More → Suspend: kecualikan dari future queue (progress SRS utuh).
 *
 * Render di bawah kartu, di semua mode (Recognition / Recall / Typing Recall).
 */
export function CardActions({ cardId }: { cardId: string }) {
  const [meta, setMeta] = useState(() => getCardMeta(cardId));
  const [confirming, setConfirming] = useState(false);

  const doFavorite = () => {
    const next = toggleFavorite(cardId);
    setMeta((m) => ({ ...m, favorite: next }));
  };

  const doSuspend = () => {
    setSuspended(cardId, true);
    setMeta((m) => ({ ...m, suspended: true }));
    setConfirming(false);
  };

  const doUnsuspend = () => {
    setSuspended(cardId, false);
    setMeta((m) => ({ ...m, suspended: false }));
  };

  return (
    <div className="card-actions">
      <button
        type="button"
        className={`card-action-btn${meta.favorite ? " is-active" : ""}`}
        aria-pressed={meta.favorite}
        aria-label={meta.favorite ? "Hapus dari favorit" : "Tandai sebagai favorit"}
        onClick={doFavorite}
      >
        {meta.favorite ? "★" : "☆"} Favorite
      </button>
      {meta.suspended ? (
        <button
          type="button"
          className="card-action-btn"
          aria-label="Kembalikan kartu ke queue"
          onClick={doUnsuspend}
        >
          Unsuspend
        </button>
      ) : confirming ? (
        <span className="card-action-confirm" role="group" aria-label="Konfirmasi suspend">
          <span className="card-action-confirm-text">Suspend this card?</span>
          <button type="button" className="card-action-btn is-danger" onClick={doSuspend}>
            Suspend
          </button>
          <button
            type="button"
            className="card-action-btn"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          className="card-action-btn"
          aria-label="Opsi kartu"
          onClick={() => setConfirming(true)}
        >
          ⋯ More
        </button>
      )}
    </div>
  );
}
