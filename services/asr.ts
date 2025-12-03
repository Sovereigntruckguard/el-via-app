// services/asr.ts
// Bridge universal: Web (Web Speech API) + Nativo (expo-speech-recognition)

import { Platform } from "react-native";
import {
  ASRHandlers as WebASRHandlers,
  ASRState as WebASRState,
  isASRAvailableWeb as _isASRAvailableWeb,
  startASR as startASRWeb,
  stopASR as stopASRWeb,
} from "./asr.web";

export type ASRState = WebASRState;
export type ASRHandlers = WebASRHandlers;

let nativeStarted = false;
let subscriptions: Array<{ remove: () => void }> = [];

// Solo tiene sentido en web; en nativo siempre usamos expo-speech-recognition
export function isASRAvailableWeb() {
  return Platform.OS === "web" ? _isASRAvailableWeb() : false;
}

async function startASRNative(
  lang: "en" | "es",
  h: ASRHandlers
): Promise<void> {
  try {
    const { ExpoSpeechRecognitionModule } = await import(
      "expo-speech-recognition"
    );

    // 1) Pedir permisos
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      h.onError?.("Permiso de micrófono denegado");
      return;
    }

    // 2) Limpiar listeners anteriores
    subscriptions.forEach((s) => s.remove());
    subscriptions = [];

    // 3) Registrar listeners
    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
        console.log("[ASR native] result event:", event);
        const arr = Array.isArray(event?.results) ? event.results : [];
        const transcript = arr
          .map((r: any) => r?.transcript ?? "")
          .join(" ")
          .trim();

        if (transcript) {
          h.onResult?.(transcript);
        }

        if (event?.isFinal) {
          h.onEnd?.();
          nativeStarted = false;
        }
      }),

      ExpoSpeechRecognitionModule.addListener("end", () => {
        console.log("[ASR native] end event");
        h.onEnd?.();
        nativeStarted = false;
      }),

      ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
        console.log("[ASR native] error event:", event);
        h.onError?.(event?.message || event?.error || "asr-error");
        nativeStarted = false;
      })
    );

    // 4) Empezar reconocimiento
    await ExpoSpeechRecognitionModule.start({
      lang: lang === "es" ? "es-US" : "en-US",
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: false,
    });

    nativeStarted = true;
  } catch (e: any) {
    console.warn("[ASR native] exception:", e);
    h.onError?.(String(e?.message ?? e));
  }
}

/** Punto de entrada universal desde las pantallas */
export function startASR(lang: "en" | "es", h: ASRHandlers): ASRState {
  if (Platform.OS === "web") {
    return startASRWeb(lang, h);
  }
  // Nativo: lanzamos async pero devolvemos listening inmediato
  startASRNative(lang, h);
  return "listening";
}

export function stopASR() {
  if (Platform.OS === "web") {
    stopASRWeb();
    return;
  }

  (async () => {
    try {
      const { ExpoSpeechRecognitionModule } = await import(
        "expo-speech-recognition"
      );
      if (nativeStarted) {
        await ExpoSpeechRecognitionModule.stop();
      } else {
        await ExpoSpeechRecognitionModule.abort?.();
      }
    } catch (e) {
      console.warn("[ASR native] stop error:", e);
    } finally {
      subscriptions.forEach((s) => s.remove());
      subscriptions = [];
      nativeStarted = false;
    }
  })();
}
