// services/voice.ts
import { Platform } from "react-native";

/** Defaults globales (ajustables desde botones) */
// Velocidad normal: 1.0 (natural)
// Velocidad lenta: mucho más despacio para imitar con claridad
export const TTS_RATE_NORMAL = 1.0;
export const TTS_RATE_SLOW   = 0.5;
export const TTS_PITCH       = 1.0;

let speaking = false;      // lock para evitar solapes
let stopRequested = false; // señal de cancelación en colas

export function isSpeaking() {
  return speaking;
}

export function cancelSpeak() {
  stopRequested = true;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  } else {
    // expo-speech no expone cancel global; usamos la marca stopRequested
  }
  speaking = false;
}

/** Normaliza rate/pitch a rangos seguros */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/** Carga/elige voz web (cuando getVoices() aún no está listo) */
function pickWebVoice(langTag: string) {
  const synth = window.speechSynthesis;
  let voices = synth.getVoices();
  if (!voices || voices.length === 0) {
    // Forzar carga diferida de voces
    return new Promise<SpeechSynthesisVoice | null>((resolve) => {
      const once = () => {
        voices = synth.getVoices();
        const v =
          voices.find((vx) =>
            vx.lang?.toLowerCase().startsWith(langTag.toLowerCase())
          ) || null;
        synth.removeEventListener?.("voiceschanged", once as any);
        resolve(v);
      };
      synth.addEventListener?.("voiceschanged", once as any);
      // fallback por si el evento no dispara
      setTimeout(() => {
        voices = synth.getVoices();
        const v =
          voices.find((vx) =>
            vx.lang?.toLowerCase().startsWith(langTag.toLowerCase())
          ) || null;
        resolve(v);
      }, 200);
    });
  }
  const v =
    voices.find((vx) =>
      vx.lang?.toLowerCase().startsWith(langTag.toLowerCase())
    ) || null;
  return Promise.resolve(v);
}

/** Hablar una frase con TTS (web / nativo) */
export async function speak(
  text?: string,
  opts: { lang?: "en" | "es"; rate?: number; pitch?: number } = {}
) {
  if (!text) return;
  const langTag = opts.lang === "es" ? "es-US" : "en-US";
  // usamos los nuevos defaults: normal 1.0, lento 0.5
  const rate = clamp(opts.rate ?? TTS_RATE_NORMAL, 0.5, 1.4);
  const pitch = clamp(opts.pitch ?? TTS_PITCH, 0.5, 2.0);

  stopRequested = false;
  speaking = true;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    await new Promise<void>(async (resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = langTag;
      utter.rate = rate;
      utter.pitch = pitch;

      try {
        const v = await pickWebVoice(langTag);
        if (v) utter.voice = v;
      } catch {}

      utter.onend = () => {
        speaking = false;
        resolve();
      };
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        speaking = false;
        resolve();
      }
    });
  } else {
    const Speech = await import("expo-speech");
    await new Promise<void>((resolve) => {
      try {
        Speech.speak(text, {
          language: langTag,
          pitch,
          rate,
          onDone: () => {
            speaking = false;
            resolve();
          },
        } as any);
      } catch {
        speaking = false;
        resolve();
      }
    });
  }
}

/** Helper: hablar lento (usa TTS_RATE_SLOW bien marcado) */
export function speakSlow(text?: string, lang: "en" | "es" = "en") {
  return speak(text, { lang, rate: TTS_RATE_SLOW });
}

/** Reproduce una cola de pasos EN/ES con pausas y cancelación */
export async function speakQueue(
  steps: Array<{
    text: string;
    lang?: "en" | "es";
    rate?: number;
    pitch?: number;
    pauseMs?: number;
  }>,
  defaultGap = 350,
  opts: { rate?: number; pitch?: number } = {}
) {
  stopRequested = false;
  for (const s of steps) {
    if (stopRequested) break;
    const lang = s.lang;
    const rate = s.rate ?? opts.rate ?? TTS_RATE_NORMAL;
    const pitch = s.pitch ?? opts.pitch ?? TTS_PITCH;
    await speak(s.text, { lang, rate, pitch });
    if (stopRequested) break;
    const gap = s.pauseMs ?? defaultGap;
    if (gap > 0) {
      await new Promise((r) => setTimeout(r, gap));
    }
  }
}
