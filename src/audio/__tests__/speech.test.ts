/**
 * Unit test modul audio (Phase 10).
 * speechSynthesis di-mock — tidak butuh microphone/audio output asli.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isSpeechSupported,
  getJapaneseVoices,
  pickJapaneseVoice,
  speakJapanese,
  stopSpeaking,
} from "../speech.js";

interface MockVoice {
  name: string;
  lang: string;
}

function installMock(voices: MockVoice[]) {
  const cancel = vi.fn();
  const speak = vi.fn();
  const getVoices = vi.fn(() => voices as SpeechSynthesisVoice[]);
  const listeners = new Map<string, () => void>();

  (globalThis as unknown as Record<string, unknown>).window = {
    speechSynthesis: {
      cancel,
      speak,
      getVoices,
      addEventListener: (ev: string, cb: () => void) => void listeners.set(ev, cb),
      removeEventListener: (ev: string) => void listeners.delete(ev),
    },
  };

  // Mock SpeechSynthesisUtterance
  const utterances: Record<string, unknown>[] = [];
  (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance =
    function (this: Record<string, unknown>, text: string) {
      this.text = text;
      utterances.push(this);
    } as unknown;

  return { cancel, speak, getVoices, utterances, listeners };
}

function uninstallMock() {
  delete (globalThis as unknown as Record<string, unknown>).window;
  delete (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance;
}

beforeEach(() => {
  uninstallMock();
});

describe("isSpeechSupported", () => {
  it("true jika speechSynthesis tersedia", () => {
    installMock([]);
    expect(isSpeechSupported()).toBe(true);
  });

  it("false jika window/speechSynthesis tidak ada", () => {
    expect(isSpeechSupported()).toBe(false);
  });
});

describe("getJapaneseVoices / pickJapaneseVoice", () => {
  it("hanya mengembalikan voice berbahasa ja, ja-JP diprioritaskan", () => {
    installMock([
      { name: "Google US English", lang: "en-US" },
      { name: "Kyoko", lang: "ja-JP" },
      { name: "Otoya", lang: "ja-JP" },
    ]);
    const voices = getJapaneseVoices();
    expect(voices.map((v) => v.name)).toEqual(["Kyoko", "Otoya"]);
    expect(pickJapaneseVoice()?.name).toBe("Kyoko");
  });

  it("menerima varian ja lain jika tidak ada ja-JP", () => {
    installMock([{ name: "Japanese", lang: "ja" }]);
    expect(getJapaneseVoices()).toHaveLength(1);
    expect(pickJapaneseVoice()?.name).toBe("Japanese");
  });

  it("null / kosong jika tidak ada Japanese voice", () => {
    installMock([{ name: "Google US English", lang: "en-US" }]);
    expect(getJapaneseVoices()).toHaveLength(0);
    expect(pickJapaneseVoice()).toBeNull();
  });
});

describe("speakJapanese", () => {
  it("cancel dulu lalu speak dengan lang ja-JP dan voice Jepang", () => {
    const { cancel, speak, utterances } = installMock([
      { name: "Kyoko", lang: "ja-JP" },
    ]);
    const ok = speakJapanese("ね");
    expect(ok).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    const u = utterances[0] as Record<string, unknown>;
    expect(u.text).toBe("ね");
    expect(u.lang).toBe("ja-JP");
    expect((u.voice as MockVoice).name).toBe("Kyoko");
    expect(u.rate).toBe(0.95);
    expect(u.pitch).toBe(1.0);
    expect(u.volume).toBe(1.0);
  });

  it("false jika tidak didukung", () => {
    expect(speakJapanese("ね")).toBe(false);
  });

  it("false jika tidak ada Japanese voice (tidak crash)", () => {
    installMock([{ name: "Google US English", lang: "en-US" }]);
    expect(speakJapanese("ね")).toBe(false);
  });

  it("tekan dua kali tidak menumpuk queue (cancel tiap speak)", () => {
    const { cancel, speak } = installMock([{ name: "Kyoko", lang: "ja-JP" }]);
    speakJapanese("ね");
    speakJapanese("きゃ");
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it("memanggil onStart/onEnd", () => {
    const { utterances } = installMock([{ name: "Kyoko", lang: "ja-JP" }]);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    speakJapanese("ね", { onStart, onEnd });
    const u = utterances[0] as Record<string, (() => void) | undefined>;
    u.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);
    u.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("stopSpeaking", () => {
  it("memanggil cancel", () => {
    const { cancel } = installMock([]);
    stopSpeaking();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("tidak crash jika tidak didukung", () => {
    expect(() => stopSpeaking()).not.toThrow();
  });
});
