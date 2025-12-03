// app/roleplays.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import {
  ASRState,
  isASRAvailableWeb,
  startASR,
  stopASR,
} from "../services/asr";
import { getModuleFeedback, grade } from "../services/eval";
import { setProgressFlag } from "../services/progress";
import { cancelSpeak, speak, speakSlow } from "../services/voice";

type Step =
  | { speaker: "inspector"; en: string; es: string }
  | {
      speaker: "driver";
      expected_en: string;
      expected_es: string;
      phonetics_es?: string;
    };

type RP = { id: string; title: string; lang: "en" | "es"; steps: Step[] };

const PKEY = "elvia:roleplays:progress";
const LOGO = require("../assets/elvia-logo.png");

export default function Roleplays() {
  const router = useRouter();

  const [roles, setRoles] = useState<RP[]>([]);
  const [rpIdx, setRpIdx] = useState(0);
  const [stIdx, setStIdx] = useState(0);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [input, setInput] = useState("");
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<{ label: string; score: number } | null>(
    null
  );
  const [auto, setAuto] = useState(false);
  const [asrState, setAsrState] = useState<ASRState>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [progress, setProgress] = useState<Record<string, number>>({});
  const [highlightNext, setHighlightNext] = useState(false);
  const [highlightTalk, setHighlightTalk] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const timer = useRef<any>(null);

  const nextPulse = useRef(new Animated.Value(0)).current;
  const talkPulse = useRef(new Animated.Value(0)).current;
  const nextLoop = useRef<Animated.CompositeAnimation | null>(null);
  const talkLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    (async () => {
      const data = await import("../content/module4_roleplays.json");
      setRoles((data.default || data) as RP[]);
      const p = await AsyncStorage.getItem(PKEY);
      if (p) setProgress(JSON.parse(p));
    })();
    return () => {
      cancelSpeak();
      clearTimeout(timer.current);
      stopASR();
      nextLoop.current?.stop();
      talkLoop.current?.stop();
    };
  }, []);

  const rp = roles[rpIdx];
  const step: Step | undefined = rp?.steps[stIdx];

  const updateProgress = async (rid: string, stepIndex: number) => {
    setProgress((prev) => {
      const next = { ...prev, [rid]: Math.max(prev[rid] || 0, stepIndex) };
      AsyncStorage.setItem(PKEY, JSON.stringify(next));
      return next;
    });
  };

  // 🔹 % real del módulo (por pasos trabajados)
  const totalSteps = roles.reduce(
    (sum, roleplay) => sum + roleplay.steps.length,
    0
  );
  const completedSteps = roles.reduce((sum, roleplay) => {
    const v = progress[roleplay.id] || 0;
    return sum + Math.min(v, roleplay.steps.length);
  }, 0);
  const completionPct = totalSteps
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0;

  // Feedback al terminar TODO el módulo SOLO cuando está al 100%
  useEffect(() => {
    if (!rp || roles.length === 0) return;

    const isLastRoleplay = rpIdx === roles.length - 1;
    const isLastStep = stIdx === rp.steps.length - 1;

    if (!isLastRoleplay || !isLastStep) return;
    if (completionPct !== 100) return; // aún no completó todo
    if (feedback || feedbackLoading) return;

    const run = async () => {
      try {
        setFeedbackLoading(true);
        const reply = await getModuleFeedback({
          moduleName: "Módulo 4 - Roleplays DOT",
          studentName: "Estudiante EL-VIA",
          score: completionPct,
          strengths: [
            "Completó todos los roleplays del módulo, practicando múltiples escenarios reales con el inspector DOT.",
          ],
          mistakes: [],
        });
        setFeedback(reply);

        // 🔹 Marcamos el módulo 4 (roleplays) como completado para el examen final
        await setProgressFlag("m4_roleplays_completed", true);
      } catch (err) {
        console.error("[ROLEPLAYS] Error generando feedback:", err);
        setFeedback(
          "No pudimos generar la retroalimentación en este momento."
        );
      } finally {
        setFeedbackLoading(false);
      }
    };

    run();
  }, [
    rp,
    rpIdx,
    stIdx,
    roles.length,
    feedback,
    feedbackLoading,
    completionPct,
  ]);

  // Encender/apagar blink de "Siguiente"
  useEffect(() => {
    if (highlightNext) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(nextPulse, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(nextPulse, {
            toValue: 0,
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      nextLoop.current = loop;
      loop.start();
    } else {
      nextLoop.current?.stop();
      nextPulse.setValue(0);
    }
  }, [highlightNext, nextPulse]);

  // Encender/apagar blink de "Hablar"
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

  // Cuando cambia de paso, reseteamos blink de "Siguiente" y activamos "Hablar" solo si es turno del conductor
  useEffect(() => {
    setHighlightNext(false);
    setHighlightTalk(step?.speaker === "driver");
  }, [step]);

  const nextScale = nextPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const nextOpacity = nextPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  const talkScale = talkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const talkOpacity = talkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  // --------- ESCUCHA INSPECTOR (normal / lento) ----------
  const playInspector = async () => {
    if (!rp || !step || step.speaker !== "inspector") return;
    cancelSpeak();
    await speak(lang === "en" ? step.en : (step as any).es, {
      lang,
      rate: 0.95,
    });
    setHighlightNext(true);
  };

  const playInspectorSlow = async () => {
    if (!rp || !step || step.speaker !== "inspector") return;
    cancelSpeak();
    await speakSlow(lang === "en" ? step.en : (step as any).es, lang);
    setHighlightNext(true);
  };

  // --------- COMPROBAR RESPUESTA DEL CONDUCTOR ----------
  const checkDriver = async () => {
    if (!rp || !step || step.speaker !== "driver") return;
    const expected = lang === "en" ? step.expected_en : step.expected_es;
    const g = grade(input, expected);
    setResult({ label: g.label, score: Math.round(g.score * 100) / 100 });
    if (g.ok) {
      await updateProgress(rp.id, stIdx + 1);
      goNext();
    }
  };

  // --------- NAVEGACIÓN PASOS ----------
  const goNext = () => {
    cancelSpeak();
    stopASR();
    setHint(false);
    setResult(null);
    setInput("");
    setStatusMsg(null);
    setHighlightNext(false);
    setHighlightTalk(false);

    if (!rp) return;
    if (stIdx + 1 < rp.steps.length) setStIdx(stIdx + 1);
    else if (rpIdx + 1 < roles.length) {
      setRpIdx(rpIdx + 1);
      setStIdx(0);
    }
  };

  const goPrev = () => {
    cancelSpeak();
    stopASR();
    setHint(false);
    setResult(null);
    setInput("");
    setStatusMsg(null);
    setHighlightNext(false);
    setHighlightTalk(false);

    if (stIdx > 0) setStIdx(stIdx - 1);
    else if (rpIdx > 0) {
      setRpIdx(rpIdx - 1);
      setStIdx(0);
    }
  };

  // --------- ASR (HABLAR) ----------
  const toggleASR = () => {
    if (asrState === "listening") {
      stopASR();
      setAsrState("idle");
      setStatusMsg(null);
      return;
    }

    if (step?.speaker !== "driver") {
      alert("Solo puedes hablar cuando sea tu turno como conductor.");
      return;
    }

    setStatusMsg(null);
    setResult(null);
    setHighlightTalk(false);

    if (Platform.OS === "web" && !isASRAvailableWeb()) {
      setAsrState("error");
      setStatusMsg(
        "El reconocimiento no está disponible en este navegador. Usa Chrome/Edge o el dictado del teclado."
      );
      alert(
        "El reconocimiento de voz no está disponible en este navegador. Usa Chrome/Edge o el dictado del teclado."
      );
      return;
    }

    const next = startASR(lang, {
      onResult: (txt) => {
        setInput(txt);
        setStatusMsg("Perfecto, sigue hablando…");
      },
      onEnd: () => {
        setAsrState("idle");
        setStatusMsg("Escucha tu respuesta y presiona Comprobar.");
      },
      onError: (err) => {
        console.log("[ASR Roleplays error]", err);
        setAsrState("error");
        const msg = String(err || "");
        if (msg.includes("no-speech")) {
          setStatusMsg(
            "No se detectó voz suficiente. Acércate más al micrófono o habla más fuerte."
          );
        } else {
          setStatusMsg(
            "No se pudo iniciar el reconocimiento. Revisa permisos de micrófono o intenta de nuevo."
          );
        }
      },
    });

    setAsrState(next);
    if (next === "listening") {
      setStatusMsg("🎙️ Micrófono activo… responde como conductor.");
    }
  };

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

        <Text style={S.title}>Roleplays · ELVIA DOT Express</Text>

        {/* Header roleplay & controls */}
        <View style={S.header}>
          <Text style={S.badge}>{rp ? rp.title : "Cargando..."}</Text>
          <View style={S.row}>
            <Btn
              small
              label={lang === "en" ? "🇺🇸 ✅" : "🇺🇸"}
              onPress={() => {
                cancelSpeak();
                stopASR();
                setLang("en");
                setStatusMsg(null);
              }}
            />
            <Btn
              small
              label={lang === "es" ? "🇨🇴 ✅" : "🇨🇴"}
              onPress={() => {
                cancelSpeak();
                stopASR();
                setLang("es");
                setStatusMsg(null);
              }}
            />
            <Btn
              small
              label={auto ? "⏸️ Auto" : "▶ Auto"}
              onPress={() => {
                cancelSpeak();
                setAuto((v) => !v);
              }}
            />
            <Animated.View
              style={
                highlightTalk
                  ? { transform: [{ scale: talkScale }], opacity: talkOpacity }
                  : undefined
              }
            >
              <Btn small label="🎤 Hablar" onPress={toggleASR} />
            </Animated.View>
          </View>
        </View>

        {/* Pasos */}
        {rp && step && (
          <View style={S.card}>
            <Text style={S.stepKicker}>
              Paso {stIdx + 1}/{rp.steps.length} ·{" "}
              {step.speaker === "inspector" ? "Inspector" : "Conductor"}
            </Text>

            {step.speaker === "inspector" ? (
              <>
                <Text style={S.line}>
                  {lang === "en" ? step.en : (step as any).es}
                </Text>
                <View style={S.row}>
                  <Btn label="🎧 Escuchar" onPress={playInspector} />
                  <Btn label="🐢 Lento" onPress={playInspectorSlow} />
                  <Btn label="⏮️ Atrás" onPress={goPrev} />
                  <Animated.View
                    style={
                      highlightNext
                        ? {
                            transform: [{ scale: nextScale }],
                            opacity: nextOpacity,
                          }
                        : undefined
                    }
                  >
                    <Btn label="⏭️ Siguiente" onPress={goNext} />
                  </Animated.View>
                </View>
              </>
            ) : (
              <>
                <Text style={S.line}>
                  {lang === "en" ? step.expected_en : step.expected_es}
                </Text>
                {lang === "es" && (step as any).phonetics_es && (
                  <Text style={S.phon}>/{(step as any).phonetics_es}/</Text>
                )}

                <TextInput
                  style={S.input}
                  placeholder={
                    lang === "en"
                      ? "Speak or type your reply…"
                      : "Habla o escribe tu respuesta…"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={input}
                  onChangeText={setInput}
                  multiline
                />

                {!!statusMsg && (
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
                  <Btn label="💡 Hint" onPress={() => setHint((h) => !h)} />
                  <Btn label="✅ Comprobar" onPress={checkDriver} />
                  <Btn label="⏮️ Atrás" onPress={goPrev} />
                  <Btn label="⏭️ Siguiente" onPress={goNext} />
                </View>
              </>
            )}
          </View>
        )}

        {/* Feedback final del módulo */}
        {feedbackLoading && (
          <View style={S.feedbackBox}>
            <Text style={S.feedbackTitle}>
              Generando retroalimentación personalizada…
            </Text>
          </View>
        )}

        {!feedbackLoading && feedback && (
          <View style={S.feedbackBox}>
            <Text style={S.feedbackTitle}>Retroalimentación del módulo</Text>
            <Text style={S.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* Navegación entre roleplays */}
        <View style={S.rowWrap}>
          {roles.map((r, i) => {
            const rpSteps = r.steps.length;
            const rpProg = progress[r.id] || 0;
            const isCompleted = rpProg >= rpSteps; // COMPLETADO REAL

            return (
              <Pressable
                key={r.id}
                style={[
                  S.rpBtn,
                  i === rpIdx && S.rpBtnActive,
                  isCompleted && S.rpBtnCompleted,
                ]}
                onPress={() => {
                  cancelSpeak();
                  stopASR();
                  setRpIdx(i);
                  setStIdx(0);
                  setInput("");
                  setResult(null);
                  setStatusMsg(null);
                  setHighlightNext(false);
                  setHighlightTalk(false);
                }}
              >
                <Text style={S.rpBtnText}>
                  {i + 1}
                  {isCompleted ? " ✓" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Navegación inferior */}
        <View style={{ height: 16 }} />
        <View style={S.navRow}>
          <Pressable
            style={S.backBtn}
            onPress={() => {
              cancelSpeak();
              router.back();
            }}
          >
            <Text style={S.backBtnText}>⬅ Atrás</Text>
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
    marginBottom: 10,
  },

  header: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  badge: { color: "#D79AB3", fontWeight: "900", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
  rowWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },

  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
  },
  stepKicker: { color: "#D79AB3", fontWeight: "900", marginBottom: 6 },
  line: { color: "#FFFFFF", marginBottom: 6 },
  phon: { color: ROSEN.colors.roseDeep, fontStyle: "italic", marginBottom: 6 },
  input: {
    backgroundColor: "#121212",
    color: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 10,
    minHeight: 60,
  },
  hint: { color: "#9CA3AF", marginTop: 6 },

  result: { marginTop: 6, fontWeight: "800" },

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

  rpBtn: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rpBtnActive: { borderColor: "#E6B7C8" },
  rpBtnCompleted: {
    borderColor: ROSEN.colors.rose,
  },

  rpBtnText: { color: "#FFFFFF", fontWeight: "800" },

  feedbackBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#111111",
  },
  feedbackTitle: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    marginBottom: 6,
  },
  feedbackText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
  },

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
  homeBtn: {
    flex: 1,
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignItems: "center",
  },
  homeBtnText: { color: "#181818", fontWeight: "900" },
});
