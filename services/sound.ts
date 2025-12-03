// services/sound.ts
import { Platform } from "react-native";

// Reproduce un audio (o muestra el texto en consola en web si no hay URL)
export async function playAudio(uri?: string, textFallback?: string) {
  if (Platform.OS === "web") {
    if (uri) {
      try {
        const a = new window.Audio(uri);
        await a.play();
      } catch (e) {
        console.log("Audio web no disponible:", textFallback);
      }
    } else {
      console.log("Frase:", textFallback);
    }
    return;
  }
  const { Audio } = await import("expo-av");
  if (!uri) return;
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((st: any) => st.didJustFinish && sound.unloadAsync());
}

// Reproduce una cola de pasos con pequeñas pausas
type Step = { uri?: string; text?: string; pauseMs?: number };
export async function playQueue(steps: Step[], gapMs = 500) {
  for (const step of steps) {
    if (step.uri || step.text) {
      await playAudio(step.uri, step.text);
      // pequeña pausa entre audios
      await new Promise((r) => setTimeout(r, step.pauseMs ?? gapMs));
    }
  }
}
