// services/asr.native.ts
import Voice, {
    SpeechEndEvent,
    SpeechErrorEvent,
    SpeechResultsEvent,
    SpeechStartEvent
} from '@react-native-voice/voice';
import { AppState } from 'react-native';

export type ASRState = 'idle' | 'listening' | 'error';
export type ASRHandlers = {
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
};

let isListening = false;
let _handlers: ASRHandlers | null = null;

function attachEvents() {
  Voice.onSpeechStart = (_e: SpeechStartEvent) => { /* opcional: console.log('ASR start') */ };
  Voice.onSpeechResults = (e: SpeechResultsEvent) => {
    const texts = e.value || [];
    const best = texts[0] || '';
    _handlers?.onResult?.(best);
  };
  Voice.onSpeechEnd = (_e: SpeechEndEvent) => {
    isListening = false;
    _handlers?.onEnd?.();
  };
  Voice.onSpeechError = (e: SpeechErrorEvent) => {
    isListening = false;
    _handlers?.onError?.(e.error?.message || 'asr-error');
  };
}

attachEvents();

// Cierra el mic si la app va a background
AppState.addEventListener('change', (state) => {
  if (state !== 'active' && isListening) {
    Voice.cancel().catch(()=>{});
    isListening = false;
    _handlers?.onEnd?.();
  }
});

export function isASRAvailableWeb() { return false; } // Solo por compatibilidad

export function startASR(lang: 'en' | 'es', h: ASRHandlers): ASRState {
  _handlers = h;
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  try {
    isListening = true;
    Voice.start(locale, {
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 600,
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 600
    } as any);
    return 'listening';
  } catch (e) {
    _handlers?.onError?.(String(e));
    isListening = false;
    return 'error';
  }
}

export function stopASR() {
  try { Voice.stop(); } catch {}
  isListening = false;
}
