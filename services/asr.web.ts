// services/asr.web.ts
export type ASRState = 'idle' | 'listening' | 'error';
export type ASRHandlers = {
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
};

let recognition: any = null;

export function isASRAvailableWeb() {
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SR;
}

export function startASR(lang: 'en' | 'es', h: ASRHandlers): ASRState {
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) { h.onError?.('ASR not available'); return 'error'; }
  try {
    recognition = new SR();
    recognition.lang = lang === 'es' ? 'es-US' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let finalTranscript = '';

    recognition.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t + ' ';
        else interim += t;
      }
      h.onResult?.(finalTranscript || interim);
    };
    recognition.onerror = (e: any) => h.onError?.(e.error || 'asr-error');
    recognition.onend = () => h.onEnd?.();
    recognition.start();
    return 'listening';
  } catch (err: any) {
    h.onError?.(String(err));
    return 'error';
  }
}

export function stopASR() {
  try { recognition && recognition.stop(); } catch {}
  recognition = null;
}
