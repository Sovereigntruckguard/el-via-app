// app/glossary.tsx  (Módulo 3 — Señales)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoseEmbossedSeal from "../components/RoseEmbossedSeal";
import { ROSEN } from "../lib/rosen";
import { getSignalImage } from "../lib/signalImages";
import { sendToNexus } from "../services/nexus";
import { setProgressFlag } from "../services/progress";
import { speak } from "../services/voice";

type Signal = {
  id: string;
  image: string; // nombre de archivo en assets/signals/
  name_en: string;
  name_es: string;
  action_en: string;
  action_es: string;
};

const KEY_M3_SEEN = "elvia:m3:seen"; // progreso: ids vistas
const KEY_M3_FEEDBACK = "elvia:m3:feedback"; // cache de retroalimentación IA
const LOGO = require("../assets/elvia-logo.png");
const FLAG_US = require("../assets/flags/flag-us.png");
const FLAG_CO = require("../assets/flags/flag-co.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GlossarySignals() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  // Estado de retroalimentación IA
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [feedbackRequested, setFeedbackRequested] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("../content/module3_signals.json");
        setSignals((mod.default || mod) as Signal[]);

        const rawSeen = await AsyncStorage.getItem(KEY_M3_SEEN);
        if (rawSeen) setSeen(JSON.parse(rawSeen));

        const rawFeedback = await AsyncStorage.getItem(KEY_M3_FEEDBACK);
        if (rawFeedback) {
          setFeedback(rawFeedback);
          setFeedbackRequested(true);
        }
      } catch (err) {
        console.error("[GLOSSARY] Error cargando módulo 3:", err);
      }
    })();
  }, []);

  const progressPct = signals.length
    ? Math.round(
        (Object.values(seen).filter(Boolean).length / signals.length) * 100
      )
    : 0;

  // Disparar retroalimentación automática cuando el módulo se complete al 100%
  useEffect(() => {
    if (
      signals.length > 0 &&
      progressPct === 100 &&
      !feedbackRequested &&
      !isRequestingFeedback
    ) {
      requestModuleFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signals.length, progressPct, feedbackRequested]);

  const requestModuleFeedback = async () => {
    try {
      console.log("[GLOSSARY] Solicitando retroalimentación del Módulo 3…");
      setIsRequestingFeedback(true);
      setFeedbackError(null);
      setFeedbackRequested(true);

      const totalSignals = signals.length;

      const prompt = [
        "Estudiante: Estudiante EL-VIA",
        "Módulo completado: Módulo 3 - Señales de tránsito",
        `Puntaje final: ${progressPct}/100`,
        "",
        "Contexto del módulo:",
        `- Practicó un total de ${totalSignals} señales de tránsito clave para conductores de carga en EE.UU.`,
        "- Escuchó el nombre y la acción recomendada en inglés y en español.",
        "",
        "Puntos fuertes del estudiante en este módulo:",
        "- Completó todas las señales marcándolas como practicadas.",
        "",
        "Errores o temas que le costaron al estudiante:",
        "- Este sistema no registra errores específicos, así que asume que el estudiante necesitó repetir algunas para memorizar.",
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

      console.log("[GLOSSARY] Feedback recibido:", reply);
      setFeedback(reply);
      await AsyncStorage.setItem(KEY_M3_FEEDBACK, reply);

      // 🔹 Marcamos el Módulo 3 (señales) como completado en el progreso global
      await setProgressFlag("m3_signals_completed", true);
    } catch (err: any) {
      console.error(
        "[GLOSSARY] Error obteniendo retroalimentación del módulo:",
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

  const goToIndex = (index: number) => {
    if (signals.length === 0) return;
    const clamped = Math.max(0, Math.min(index, signals.length - 1));
    setCurrentIndex(clamped);
    scrollRef.current?.scrollTo({
      x: clamped * SCREEN_WIDTH,
      y: 0,
      animated: true,
    });
  };

  const handlePageChange = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(page);
  };

  const markSeen = async (id: string, advance: boolean = false) => {
    setSeen((prev) => {
      const next = { ...prev, [id]: true };
      AsyncStorage.setItem(KEY_M3_SEEN, JSON.stringify(next));
      return next;
    });
    if (advance) {
      const idx = signals.findIndex((s) => s.id === id);
      if (idx >= 0 && idx + 1 < signals.length) {
        goToIndex(idx + 1);
      }
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

        <Text style={S.title}>Señales de tránsito</Text>
        <Text style={S.desc}>
          Aprende a reconocer las señales más importantes del camino y qué hacer
          ante cada una.
        </Text>

        {/* Progreso */}
        <View style={S.progressBox}>
          <View style={S.progressOuter}>
            <View style={[S.progressInner, { width: `${progressPct}%` }]} />
          </View>
          <Text style={S.progressText}>
            Señal {signals.length ? currentIndex + 1 : 0} de{" "}
            {signals.length || 0} · {progressPct}%
          </Text>
        </View>

        {/* Leyenda */}
        <View style={S.legendRow}>
          <View style={S.legendItem}>
            <Text style={S.legendIcon}>🐢</Text>
            <Text style={S.legendText}>Lento</Text>
          </View>
          <View style={S.legendItem}>
            <Text style={S.legendIcon}>🇺🇸</Text>
            <Text style={S.legendText}>Inglés</Text>
          </View>
          <View style={S.legendItem}>
            <Text style={S.legendIcon}>🇨🇴</Text>
            <Text style={S.legendText}>Español</Text>
          </View>
        </View>

        {/* Carrusel de señales */}
        {signals.length > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePageChange}
          >
            {signals.map((sg) => {
              const img = getSignalImage(sg.image);
              const unlocked = !!seen[sg.id];

              return (
                <View key={sg.id} style={{ width: SCREEN_WIDTH }}>
                  <View style={[S.card, unlocked && S.cardSeen]}>
                    {/* HERO de la señal */}
                    <View style={S.signalHero}>
                      <Image
                        source={img}
                        style={S.heroIcon}
                        resizeMode="contain"
                      />
                      <Text style={S.heroNameEn}>{sg.name_en}</Text>
                      <Text style={S.heroNameEs}>{sg.name_es}</Text>
                    </View>

                    {/* Qué hacer */}
                    <Text style={S.caption}>¿Qué hacer?</Text>
                    <Text style={S.action}>{sg.action_en}</Text>
                    <Text style={S.actionES}>{sg.action_es}</Text>

                    {/* Audio nombre */}
                    <Text style={S.subCaption}>Nombre de la señal</Text>
                    <View style={S.rowBtns}>
                      {/* Normal EN */}
                      <Btn
                        label="🎧 🇺🇸"
                        onPress={() =>
                          speak(sg.name_en, { lang: "en", rate: 1.15 })
                        }
                      />
                      {/* Lento EN */}
                      <Btn
                        label="🐢 🇺🇸"
                        onPress={() =>
                          speak(sg.name_en, { lang: "en", rate: 0.4 })
                        }
                      />
                      {/* Normal ES */}
                      <Btn
                        label="🎧 🇨🇴"
                        onPress={() =>
                          speak(sg.name_es, { lang: "es", rate: 1.15 })
                        }
                      />
                      {/* Lento ES */}
                      <Btn
                        label="🐢 🇨🇴"
                        onPress={() =>
                          speak(sg.name_es, { lang: "es", rate: 0.4 })
                        }
                      />
                    </View>

                    {/* Audio acción */}
                    <Text style={S.subCaption}>Acción recomendada</Text>
                    <View style={S.rowBtns}>
                      {/* Normal EN */}
                      <Btn
                        label="🎧 🇺🇸"
                        onPress={() =>
                          speak(sg.action_en, { lang: "en", rate: 1.15 })
                        }
                      />
                      {/* Lento EN */}
                      <Btn
                        label="🐢 🇺🇸"
                        onPress={() =>
                          speak(sg.action_en, { lang: "en", rate: 0.4 })
                        }
                      />
                      {/* Normal ES */}
                      <Btn
                        label="🎧 🇨🇴"
                        onPress={() =>
                          speak(sg.action_es, { lang: "es", rate: 1.15 })
                        }
                      />
                      {/* Lento ES */}
                      <Btn
                        label="🐢 🇨🇴"
                        onPress={() =>
                          speak(sg.action_es, { lang: "es", rate: 0.4 })
                        }
                      />
                    </View>

                    {/* Completado */}
                    <View style={S.doneRow}>
                      <Text
                        style={[
                          S.doneText,
                          unlocked && { color: "#22c55e" },
                        ]}
                      >
                        {unlocked
                          ? "Señal completada ✓"
                          : "Marca como completada después de practicar."}
                      </Text>
                      <Pressable
                        style={[S.doneBtn, unlocked && S.doneBtnActive]}
                        onPress={() => markSeen(sg.id, true)}
                      >
                        <Text
                          style={[
                            S.doneBtnText,
                            unlocked && S.doneBtnTextActive,
                          ]}
                        >
                          {unlocked ? "Completada" : "Completada ✓"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Retroalimentación del módulo 3 */}
        {progressPct === 100 && (
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
                  Generando retroalimentación personalizada con tu instructor
                  EL-VIA…
                </Text>
              </View>
            )}

            {!isRequestingFeedback && feedback && (
              <>
                <Text style={S.feedbackText}>{feedback}</Text>

                {/* CTA de lujo hacia el examen de señales */}
                <Pressable
                  style={S.examBtn}
                  onPress={() => router.push("/exam-m3")}
                >
                  <Text style={S.examBtnText}>
                    🚧 Ir al examen de señales de tránsito
                  </Text>
                </Pressable>
              </>
            )}

            {!isRequestingFeedback && !feedback && feedbackError && (
              <Text style={S.feedbackTextError}>
                No pudimos generar la retroalimentación en este momento. Intenta
                más tarde.
              </Text>
            )}
          </View>
        )}

        {/* Navegación inferior */}
        <View style={{ height: 16 }} />
        <View style={S.navRow}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <Text style={S.backBtnText}>⬅ Atrás</Text>
          </Pressable>
          <Link href="/home" style={S.homeBtn}>
            <Text style={S.homeBtnText}>🏠 Volver al inicio</Text>
          </Link>
        </View>

        <View style={{ height: 16 }} />
        <RoseEmbossedSeal />
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  // Analiza el label para sacar emoji y banderas
  let display = label;
  let flag: "us" | "co" | undefined;

  if (label.includes("🇺🇸")) {
    display = label.replace("🇺🇸", "").trim();
    flag = "us";
  } else if (label.includes("🇨🇴")) {
    display = label.replace("🇨🇴", "").trim();
    flag = "co";
  }

  return (
    <Pressable style={S.btn} onPress={onPress}>
      <View style={S.btnContent}>
        {display.length > 0 && <Text style={S.btnTxt}>{display}</Text>}
        {flag === "us" && (
          <Image source={FLAG_US} style={S.flagIcon} resizeMode="contain" />
        )}
        {flag === "co" && (
          <Image source={FLAG_CO} style={S.flagIcon} resizeMode="contain" />
        )}
      </View>
    </Pressable>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  container: { flex: 1, backgroundColor: ROSEN.colors.black },
  body: { paddingTop: 16, paddingBottom: 28 },

  logoWrap: { alignItems: "center", marginBottom: 4 },
  logo: { width: 120, height: 60, opacity: 0.98 },

  title: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    fontSize: 20,
    marginHorizontal: 16,
  },
  desc: { color: ROSEN.colors.mute, marginHorizontal: 16, marginBottom: 12 },

  progressBox: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  progressOuter: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: ROSEN.colors.rose,
  },
  progressText: {
    color: ROSEN.colors.white,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1E1E1E",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  legendIcon: { fontSize: 14 },
  legendText: { color: "#E6B7C8", fontSize: 12, fontWeight: "600" },

  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
  },
  cardSeen: {
    borderColor: ROSEN.colors.rose,
    shadowColor: ROSEN.colors.rose,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  signalHero: {
    alignItems: "center",
    marginBottom: 10,
  },
  heroIcon: { width: 96, height: 96, marginBottom: 6 },
  heroNameEn: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
  },
  heroNameEs: {
    color: ROSEN.colors.rose,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },

  caption: { color: "#E6B7C8", fontWeight: "900", marginTop: 6 },
  subCaption: {
    color: "#C4C4C4",
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 2,
    fontSize: 13,
  },
  action: { color: "#FFFFFF", marginTop: 4 },
  actionES: { color: "#9CA3AF", marginTop: 2 },

  rowBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  btn: {
    backgroundColor: "#0a84ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  flagIcon: {
    width: 18,
    height: 18,
  },

  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  doneText: {
    color: "#9CA3AF",
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  doneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    backgroundColor: "transparent",
  },
  doneBtnActive: {
    backgroundColor: ROSEN.colors.rose,
  },
  doneBtnText: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "800",
    fontSize: 12,
  },
  doneBtnTextActive: {
    color: "#181818",
  },

  feedbackCard: {
    marginTop: 16,
    marginHorizontal: 16,
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
  examBtn: {
    marginTop: 14,
    backgroundColor: ROSEN.colors.rose,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignItems: "center",
  },
  examBtnText: {
    color: "#181818",
    fontWeight: "900",
    fontSize: 14,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginHorizontal: 16,
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
