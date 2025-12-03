// app/pronunciation.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoseEmbossedSeal from "../components/RoseEmbossedSeal";
import { ROSEN } from "../lib/rosen";
import { ASRState, isASRAvailableWeb, startASR, stopASR } from "../services/asr";
import { diffTokens } from "../services/diff";
import { grade } from "../services/eval";
import { sendToNexus } from "../services/nexus";
import { setProgressFlag } from "../services/progress";
import {
  cancelSpeak,
  speak,
  speakQueue,
  speakSlow,
  TTS_RATE_SLOW,
} from "../services/voice";

type PItem = {
  id: string;
  category?: string;
  inspector_en: string;
  inspector_es: string;
  inspector_es_phonetics?: string;
  driver_en: string;
  driver_es: string;
  driver_es_phonetics?: string;
};

const PKEY = "elvia:pronunciation:progress";
const PKEY_FEEDBACK = "elvia:pronunciation:feedback";
const LOGO = require("../assets/elvia-logo.png");

export default function Pronunciation() {
  const router = useRouter();

  const [list, setList] = useState<PItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [role, setRole] = useState<"inspector" | "driver">("driver");
  const [lang, setLang] = useState<"en" | "es">("en");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ label: string; score: number } | null>(
    null
  );
  const [asrState, setAsrState] = useState<ASRState>("idle");
  const [shadow, setShadow] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [highlightTalk, setHighlightTalk] = useState(false);

  // Retroalimentación IA módulo Pronunciación
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [feedbackRequested, setFeedbackRequested] = useState(false);

  const timer = useRef<any>(null);

  // Animación de micrófono (pulso)
  const micAnim = useRef(new Animated.Value(0)).current;
  const micLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Animación de parpadeo para el botón "Hablar"
  const talkPulse = useRef(new Animated.Value(0)).current;
  const talkLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const src = await import("../content/module2_phrases.json");
        const arr = (src.default || src) as any[];
        const targets: PItem[] = arr.map((it) => ({
          id: it.id,
          category: it.category,
          inspector_en: it.inspector_en,
          inspector_es: it.inspector_es,
          inspector_es_phonetics: it.inspector_es_phonetics,
          driver_en: it.driver_en,
          driver_es: it.driver_es,
          driver_es_phonetics: it.driver_es_phonetics,
        }));
        setList(targets);
      } catch {
        setList([]);
      }
      const p = await AsyncStorage.getItem(PKEY);
      if (p) setProgress(JSON.parse(p));

      const fb = await AsyncStorage.getItem(PKEY_FEEDBACK);
      if (fb) {
        setFeedback(fb);
        setFeedbackRequested(true);
      }
    })();

    return () => {
      cancelSpeak();
      stopASR();
      clearTimeout(timer.current);
      micLoop.current?.stop();
      micAnim.setValue(0);
      talkLoop.current?.stop();
      talkPulse.setValue(0);
    };
  }, []);

  // Frases completadas (evaluadas al menos una vez)
  const completedCount = useMemo(
    () => Object.values(progress).filter((v) => v > 0).length,
    [progress]
  );

  const completionPct = list.length
    ? Math.round((completedCount / list.length) * 100)
    : 0;

  // Disparar retroalimentación cuando el módulo se complete al 100%
  useEffect(() => {
    if (
      list.length > 0 &&
      completionPct === 100 &&
      !feedbackRequested &&
      !isRequestingFeedback
    ) {
      requestModuleFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, completionPct, feedbackRequested]);

  const requestModuleFeedback = async () => {
    try {
      console.log("[PRONUNCIATION] Solicitando retroalimentación del módulo…");
      setIsRequestingFeedback(true);
      setFeedbackError(null);
      setFeedbackRequested(true);

      const totalPhrases = list.length;

      const prompt = [
        "Estudiante: Estudiante EL-VIA",
        "Módulo completado: Módulo 2 - Pronunciación",
        `Puntaje final estimado: ${completionPct}/100`,
        "",
        "Contexto del módulo:",
        `- Practicó un total de ${totalPhrases} frases clave de conversación con el inspector DOT y el conductor.`,
        "- El sistema registra como completada cada frase cuando el estudiante la pronuncia o la escribe y la evalúa.",
        "",
        "Puntos fuertes del estudiante en este módulo:",
        "- Completó todas las frases del módulo, practicando pronunciación en inglés y comprensión en español.",
        "",
        "Limitaciones del sistema:",
        "- El sistema no guarda el detalle de cada error de pronunciación, solo que las frases fueron trabajadas.",
        "",
        "Genera una retroalimentación corta (máx. 6 líneas), en español sencillo, con este formato:",
        "1) Resumen del desempeño",
        "2) Qué hizo bien",
        "3) Qué debe mejorar",
        "4) Una recomendación concreta para el próximo módulo",
      ].join("\n");

      const reply = await sendToNexus([
        {
          role: "user",
          content: prompt,
        },
      ]);

      console.log("[PRONUNCIATION] Feedback recibido:", reply);
      setFeedback(reply);
      await AsyncStorage.setItem(PKEY_FEEDBACK, reply);

      // 🔹 Marcamos el Módulo 2 (Pronunciación) como completado en el progreso global
      await setProgressFlag("m2_pronunciation_completed", true);
    } catch (err: any) {
      console.error(
        "[PRONUNCIATION] Error obteniendo retroalimentación del módulo:",
        err
      );
      setFeedbackError(
        err?.message ||
          "No pudimos generar la retroalimentación en este momento."
      );
    } finally {
      setIsRequestingFeedback(false);
    }
  };

  // Animación según estado ASR (indicador de mic)
  useEffect(() => {
    if (asrState === "listening") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(micAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(micAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      micLoop.current = loop;
      loop.start();
    } else {
      micLoop.current?.stop();
      micLoop.current = null;
      micAnim.setValue(0);
    }
  }, [asrState, micAnim]);

  // Animación de parpadeo del botón "Hablar"
  useEffect(() => {
    if (highlightTalk) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(talkPulse, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(talkPulse, {
            toValue: 0,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      talkLoop.current = loop;
      loop.start();
    } else {
      talkLoop.current?.stop();
      talkPulse.setValue(0);
    }
  }, [highlightTalk, talkPulse]);

  const item = list[idx];

  const expectedText = useMemo(() => {
    if (!item) return "";
    if (role === "inspector")
      return lang === "en" ? item.inspector_en : item.inspector_es;
    return lang === "en" ? item.driver_en : item.driver_es;
  }, [item, role, lang]);

  const phonetics = useMemo(() => {
    if (!item) return "";
    if (role === "inspector")
      return lang === "es" ? item.inspector_es_phonetics || "" : "";
    return lang === "es" ? item.driver_es_phonetics || "" : "";
  }, [item, role, lang]);

  const isCurrentCompleted = useMemo(() => {
    if (!item) return false;
    return progress[item.id] > 0;
  }, [item, progress]);

  /** TTS del objetivo (normal / lento real) */
  const speakTarget = async (slow?: boolean) => {
    if (!expectedText) return;
    cancelSpeak();
    setStatusMsg(null);
    if (slow) await speakSlow(expectedText, lang);
    else await speak(expectedText, { lang, rate: 0.95 });

    // tras escuchar, sugerimos hablar (parpadeo)
    setHighlightTalk(true);
  };

  const stopAll = () => {
    setShadow(false);
    setAsrState("idle");
    setStatusMsg(null);
    stopASR();
    cancelSpeak();
    setHighlightTalk(false);
  };

  /** Shadow/Hablar refinado: escucha, luego repite con micrófono + animación */
  const doShadow = async () => {
    if (!expectedText) return;

    // Si ya está escuchando → detener todo (toggle)
    if (shadow || asrState === "listening") {
      stopAll();
      return;
    }

    setShadow(true);
    setResult(null);
    setInput("");
    setStatusMsg("Escucha primero y luego repite en voz alta…");
    setHighlightTalk(false); // se detiene el parpadeo al tocar Hablar

    // 1) Reproducir frase en lento
    await speakQueue([{ text: expectedText, lang, pauseMs: 350 }], 250, {
      rate: TTS_RATE_SLOW,
    });

    // 2) Verificar ASR disponible en web
    if (Platform.OS === "web" && !isASRAvailableWeb()) {
      setShadow(false);
      setStatusMsg(
        "El reconocimiento de voz no está disponible en este navegador."
      );
      alert("El reconocimiento de voz no está disponible en este navegador.");
      return;
    }

    // 3) Activar ASR
    const st = startASR(lang, {
      onResult: (txt) => {
        setInput(txt);
        setStatusMsg("Perfecto, sigue hablando…");
      },
      onEnd: () => {
        setAsrState("idle");
        setShadow(false);
        setStatusMsg("Escucha tu resultado y presiona Evaluar.");
      },
      onError: (err) => {
        console.log("[ASR UI error]", err);
        setAsrState("error");
        setShadow(false);
        if (String(err).includes("no-speech")) {
          setStatusMsg(
            "No se detectó voz suficiente. Acércate más al micrófono o habla más fuerte."
          );
        } else {
          setStatusMsg(
            "No se pudo iniciar el reconocimiento. Intenta de nuevo o revisa permisos."
          );
        }
      },
    });

    setAsrState(st);
    if (st === "listening") {
      setStatusMsg("🎙️ Micrófono activo… pronuncia con claridad.");
    }
  };

  const evaluate = async () => {
    stopASR();

    if (!input.trim()) {
      setStatusMsg("Primero pronuncia o escribe tu versión antes de evaluar.");
      return;
    }

    const g = grade(input, expectedText);
    const rounded = Math.round(g.score * 100) / 100;
    setResult({ label: g.label, score: rounded });

    const tips = diffTokens(input, expectedText);
    if (tips.missing.length || tips.excess.length) {
      const miss = tips.missing.length
        ? `Faltó: ${tips.missing.slice(0, 6).join(", ")}`
        : "";
      const exc = tips.excess.length
        ? ` · Sobrante: ${tips.excess.slice(0, 6).join(", ")}`
        : "";
      console.log("[coach]", miss + exc);
    }

    setProgress((prev) => {
      const id = item?.id || "target";
      const next = { ...prev, [id]: 1 };
      AsyncStorage.setItem(PKEY, JSON.stringify(next));
      return next;
    });

    setStatusMsg(
      "Evaluación lista. Ajusta detalles y vuelve a intentar si quieres."
    );
  };

  const nextTarget = () => {
    stopAll();
    setResult(null);
    setInput("");
    setStatusMsg(null);
    setIdx((i) => {
      if (list.length === 0) return 0;
      // en la última frase nos quedamos en la última
      return Math.min(i + 1, list.length - 1);
    });
  };

  const prevTarget = () => {
    stopAll();
    setResult(null);
    setInput("");
    setStatusMsg(null);
    setIdx((i) => {
      if (list.length === 0) return 0;
      // en la primera frase nos quedamos en la primera
      return Math.max(i - 1, 0);
    });
  };

  // Anim mic
  const micScale = micAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });
  const micOpacity = micAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  // Anim para botón Hablar
  const talkScale = talkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const talkOpacity = talkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.container}
        contentContainerStyle={S.body}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View style={S.logoWrap}>
          <Image source={LOGO} style={S.logo} resizeMode="contain" />
        </View>

        <Text style={S.title}>Pronunciación</Text>
        <Text style={S.progressSummary}>
          Frases completadas: {completedCount}/{list.length || 0} ·{" "}
          {completionPct}%
        </Text>

        <View style={S.row}>
          <Btn
            small
            label={role === "inspector" ? "Inspector ✅" : "Inspector"}
            onPress={() => {
              stopAll();
              setRole("inspector");
            }}
          />
          <Btn
            small
            label={role === "driver" ? "Conductor ✅" : "Conductor"}
            onPress={() => {
              stopAll();
              setRole("driver");
            }}
          />
          <Btn
            small
            label={lang === "en" ? "🇺🇸 ✅" : "🇺🇸"}
            onPress={() => {
              stopAll();
              setLang("en");
            }}
          />
          <Btn
            small
            label={lang === "es" ? "🇨🇴 ✅" : "🇨🇴"}
            onPress={() => {
              stopAll();
              setLang("es");
            }}
          />
        </View>

        {item && (
          <View style={S.card}>
            <View style={S.headerRow}>
              <Text style={S.kicker}>
                {item.category || "General"} · #{idx + 1}/{list.length}
              </Text>

              {/* Indicador de estado de esta frase */}
              <View style={S.currentStatusPill}>
                <View
                  style={[
                    S.currentStatusDot,
                    isCurrentCompleted && { backgroundColor: "#22c55e" },
                  ]}
                />
                <Text style={S.currentStatusText}>
                  {isCurrentCompleted ? "Frase completada" : "Pendiente"}
                </Text>
              </View>

              {/* Indicador de micrófono / estado */}
              <View style={S.micWrapper}>
                <Animated.View
                  style={[
                    S.micPulse,
                    {
                      opacity:
                        asrState === "listening" || shadow ? micOpacity : 0,
                      transform: [{ scale: micScale }],
                    },
                  ]}
                />
                <View
                  style={[
                    S.micDot,
                    asrState === "listening" && { backgroundColor: "#22c55e" },
                    asrState === "error" && { backgroundColor: "#f97316" },
                  ]}
                />
              </View>
            </View>

            <Text style={S.target}>{expectedText}</Text>
            {!!phonetics && <Text style={S.phon}>/{phonetics}/</Text>}

            <View style={S.row}>
              <Btn label="🎧 Escuchar" onPress={() => speakTarget(false)} />
              <Btn label="🐢 Lento" onPress={() => speakTarget(true)} />
              <Animated.View
                style={
                  highlightTalk
                    ? { transform: [{ scale: talkScale }], opacity: talkOpacity }
                    : undefined
                }
              >
                <Btn label="🎤 Hablar" onPress={doShadow} />
              </Animated.View>
            </View>

            <TextInput
              style={S.input}
              placeholder={
                lang === "en" ? "Speak or type here…" : "Habla o escribe aquí…"
              }
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
            />

            {statusMsg && (
              <Text
                style={[
                  S.hint,
                  asrState === "error"
                    ? { color: "#f97316" }
                    : { color: "#22c55e" },
                ]}
              >
                {statusMsg}
              </Text>
            )}

            {result && (
              <Text
                style={[
                  S.result,
                  result.label.startsWith("Excelente") ||
                  result.label.startsWith("Muy")
                    ? { color: "#22c55e" }
                    : { color: "#f59e0b" },
                ]}
              >
                {result.label} · {result.score}
              </Text>
            )}

            <View style={S.row}>
              <Btn label="✅ Evaluar" onPress={evaluate} />
              <Btn label="⏮️ Anterior" onPress={prevTarget} />
              <Btn label="⏭️ Siguiente" onPress={nextTarget} />
            </View>
          </View>
        )}

        {/* Retroalimentación del módulo de Pronunciación */}
        {completionPct === 100 && (
          <View style={S.feedbackCard}>
            <Text style={S.feedbackTitle}>Retroalimentación del módulo</Text>

            {isRequestingFeedback && (
              <View style={S.feedbackLoadingRow}>
                <ActivityIndicator
                  size="small"
                  color={ROSEN.colors.rose}
                  style={{ marginRight: 8 }}
                />
                <Text style={S.feedbackText}>
                  Generando retroalimentación personalizada sobre tu
                  pronunciación…
                </Text>
              </View>
            )}

            {!isRequestingFeedback && feedback && (
              <Text style={S.feedbackText}>{feedback}</Text>
            )}

            {!isRequestingFeedback && !feedback && feedbackError && (
              <Text style={S.feedbackTextError}>
                No pudimos generar la retroalimentación en este momento. Intenta
                más tarde.
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 16 }} />
        <View style={S.navRow}>
          <Pressable
            style={S.backBtn}
            onPress={() => {
              cancelSpeak();
              router.back();
            }}
          >
            <Text style={S.backBtnText}>← Atrás</Text>
          </Pressable>
          <Link href="/home" style={S.homeBtn}>
            <Text style={S.homeBtnText}>Volver al inicio</Text>
          </Link>
        </View>
        <View style={{ height: 16 }} />
        <RoseEmbossedSeal />
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({
  label,
  onPress,
  small,
}: {
  label: string;
  onPress: () => void;
  small?: boolean;
}) {
  return (
    <Pressable style={[S.btn, small && S.btnSmall]} onPress={onPress}>
      <Text style={S.btnText}>{label}</Text>
    </Pressable>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  container: { flex: 1, backgroundColor: ROSEN.colors.black },
  body: { paddingTop: 16, padding: 16, paddingBottom: 28 },

  logoWrap: { alignItems: "center", marginBottom: 4 },
  logo: { width: 120, height: 60, opacity: 0.98 },

  title: {
    color: ROSEN.colors.rose,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  progressSummary: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap",
  },

  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kicker: { color: "#D79AB3", fontWeight: "900" },

  currentStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginRight: 8,
  },
  currentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6b7280",
    marginRight: 6,
  },
  currentStatusText: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "600",
  },

  target: { color: "#FFFFFF", marginBottom: 4 },
  phon: { color: ROSEN.colors.roseDeep, fontStyle: "italic", marginBottom: 6 },

  input: {
    backgroundColor: "#121212",
    color: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 10,
    minHeight: 60,
    marginTop: 8,
  },
  hint: { marginTop: 6, fontSize: 12 },

  btn: {
    backgroundColor: "#0a84ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 10 },
  btnText: { color: "#fff", fontWeight: "800" },
  result: { marginTop: 8, fontSize: 16, fontWeight: "600" },

  homeBtn: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignSelf: "flex-end",
    flex: 1,
    alignItems: "center",
  },
  homeBtnText: { color: "#181818", fontWeight: "900" },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignItems: "center",
  },
  backBtnText: {
    color: ROSEN.colors.rose,
    fontWeight: "800",
  },

  micWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  micPulse: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#22c55e",
  },
  micDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6b7280",
  },

  feedbackCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  feedbackTitle: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 14,
  },
  feedbackText: {
    color: ROSEN.colors.white,
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackTextError: {
    color: "#f87171",
    fontSize: 13,
  },
  feedbackLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
