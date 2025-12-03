// app/training.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
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
import { getModuleFeedback } from "../services/eval";
import { setProgressFlag } from "../services/progress";
import { cancelSpeak, speak, speakQueue, speakSlow } from "../services/voice";

type M2Item = {
  id: string;
  category?: string;
  inspector_en: string;
  inspector_es: string;
  inspector_es_phonetics?: string;
  driver_en: string;
  driver_es: string;
  driver_es_phonetics?: string;
  scene_en: string;
  scene_es: string;
};

const STORAGE_KEY = "elvia:m2:progress";
const LOGO = require("../assets/elvia-logo.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Training() {
  const router = useRouter();

  const [list, setList] = useState<M2Item[]>([]);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showPhonetics, setShowPhonetics] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔹 Feedback IA del módulo
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const indexRef = useRef(0);
  const timerRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    (async () => {
      const p = await AsyncStorage.getItem(STORAGE_KEY);
      if (p) setCompleted(JSON.parse(p));
      const mod2 = await import("../content/module2_phrases.json");
      const arr = (mod2.default || mod2) as M2Item[];
      setList(arr);
    })();
    return () => {
      cancelSpeak();
      clearTimeout(timerRef.current);
    };
  }, []);

  const total = list.length;
  const done = Object.values(completed).filter(Boolean).length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;

  // 🔹 Cuando el estudiante completa TODO el módulo por primera vez, pedimos feedback a Nexus/Arcanum
  // y marcamos el módulo como COMPLETADO en el sistema global de progreso.
  useEffect(() => {
    const shouldRequest =
      total > 0 && done === total && !feedback && !feedbackLoading;

    if (!shouldRequest) return;

    const run = async () => {
      try {
        setFeedbackLoading(true);
        const reply = await getModuleFeedback({
          moduleName: "Módulo 2 - Frases con inspector",
          studentName: "Estudiante EL-VIA",
          score: progressPct,
          strengths: [
            "Completó todas las frases del módulo de práctica con el inspector.",
          ],
          mistakes: [],
        });
        setFeedback(reply);

        // 🔹 Marcamos el módulo 1 (frases con inspector) como completado
        await setProgressFlag("m1_phrases_completed", true);
      } catch (err) {
        console.error(
          "[TRAINING] Error obteniendo retroalimentación del módulo:",
          err
        );
        setFeedback(
          "No pudimos generar la retroalimentación en este momento. Intenta más tarde."
        );
        // IMPORTANTE: si falla la retroalimentación, NO marcamos el módulo como completado globalmente.
      } finally {
        setFeedbackLoading(false);
      }
    };

    run();
  }, [total, done, progressPct, feedback, feedbackLoading]);

  const goToIndex = (index: number) => {
    if (list.length === 0) return;
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    setCurrentIndex(clamped);
    scrollRef.current?.scrollTo({
      x: clamped * SCREEN_WIDTH,
      y: 0,
      animated: true,
    });
  };

  const markDone = async (id: string, advance: boolean = false) => {
    const next = { ...completed, [id]: true };
    setCompleted(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (advance && !autoPlay) {
      const idx = list.findIndex((it) => it.id === id);
      if (idx >= 0 && idx + 1 < list.length) {
        goToIndex(idx + 1);
      }
    }
  };

  const playInspector = async (
    it: M2Item,
    lang: "en" | "es",
    slow?: boolean
  ) => {
    cancelSpeak();
    clearTimeout(timerRef.current);
    setPlayingId(it.id);
    if (slow)
      await speakSlow(
        lang === "en" ? it.inspector_en : it.inspector_es,
        lang
      );
    else
      await speak(lang === "en" ? it.inspector_en : it.inspector_es, {
        lang,
        rate: 0.95,
      });
    setPlayingId(null);
  };

  const playDriver = async (
    it: M2Item,
    lang: "en" | "es",
    slow?: boolean
  ) => {
    cancelSpeak();
    clearTimeout(timerRef.current);
    setPlayingId(it.id);
    if (slow)
      await speakSlow(lang === "en" ? it.driver_en : it.driver_es, lang);
    else
      await speak(lang === "en" ? it.driver_en : it.driver_es, {
        lang,
        rate: 0.95,
      });
    setPlayingId(null);
  };

  const playScene = async (
    it: M2Item,
    mode: "en" | "es" | "both",
    slow?: boolean
  ) => {
    cancelSpeak();
    clearTimeout(timerRef.current);
    setPlayingId(it.id);

    if (slow) {
      if (mode === "en") {
        await speakSlow(`Inspector: ${it.inspector_en}`, "en");
        await pause(450);
        await speakSlow(`Driver: ${it.driver_en}`, "en");
        await pause(650);
      } else if (mode === "es") {
        await speakSlow(`Inspector: ${it.inspector_es}`, "es");
        await pause(450);
        await speakSlow(`Conductor: ${it.driver_es}`, "es");
        await pause(650);
      } else {
        await speakSlow(`Inspector: ${it.inspector_en}`, "en");
        await pause(450);
        await speakSlow(`Driver: ${it.driver_en}`, "en");
        await pause(650);
        await speakSlow(`Inspector: ${it.inspector_es}`, "es");
        await pause(450);
        await speakSlow(`Conductor: ${it.driver_es}`, "es");
        await pause(650);
      }
    } else {
      if (mode === "en") {
        await speakQueue(
          [
            { text: `Inspector: ${it.inspector_en}`, lang: "en", pauseMs: 450 },
            { text: `Driver: ${it.driver_en}`, lang: "en", pauseMs: 650 },
          ],
          400
        );
      } else if (mode === "es") {
        await speakQueue(
          [
            { text: `Inspector: ${it.inspector_es}`, lang: "es", pauseMs: 450 },
            { text: `Conductor: ${it.driver_es}`, lang: "es", pauseMs: 650 },
          ],
          400
        );
      } else {
        await speakQueue(
          [
            { text: `Inspector: ${it.inspector_en}`, lang: "en", pauseMs: 450 },
            { text: `Driver: ${it.driver_en}`, lang: "en", pauseMs: 650 },
            { text: `Inspector: ${it.inspector_es}`, lang: "es", pauseMs: 450 },
            { text: `Conductor: ${it.driver_es}`, lang: "es", pauseMs: 650 },
          ],
          400
        );
      }
    }

    await markDone(it.id, true);
    setPlayingId(null);
  };

  // Modo repaso automático
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!autoPlay || list.length === 0) return;

    const run = async () => {
      cancelSpeak();
      const idx = indexRef.current % list.length;
      const it = list[idx];
      goToIndex(idx);
      setPlayingId(it.id);
      await speak(it.inspector_en, { lang: "en", rate: 0.95 });
      await speakSlow(it.driver_en, "en");
      await markDone(it.id);
      setPlayingId(null);
      indexRef.current = idx + 1;
      timerRef.current = setTimeout(run, 300);
    };

    run();

    return () => {
      cancelSpeak();
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, list.length]);

  const handlePageChange = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(page);
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

        <Text style={S.blockTitle}>Frases con inspector</Text>

        {/* Progreso global */}
        <View style={S.progressWrap}>
          <View style={[S.progressBar, { width: `${progressPct}%` }]} />
          <Text style={S.progressText}>
            Frase {total ? currentIndex + 1 : 0} de {total || 0} · {progressPct}%
          </Text>
        </View>

        {/* Toggles */}
        <Row>
          <Pressable
            style={[S.toggle, autoPlay ? S.toggleOn : S.toggleOff]}
            onPress={() => {
              cancelSpeak();
              setPlayingId(null);
              setAutoPlay((v) => !v);
            }}
          >
            <Text style={autoPlay ? S.toggleOnText : S.toggleText}>
              {autoPlay ? "⏸️ Repaso activo" : "▶️ Activar repaso"}
            </Text>
          </Pressable>

          <Pressable
            style={[S.toggle, showPhonetics ? S.toggleOn : S.toggleOff]}
            onPress={() => setShowPhonetics((v) => !v)}
          >
            <Text style={showPhonetics ? S.toggleOnText : S.toggleText}>
              {showPhonetics ? "✅ Ver fonética" : "🔤 Mostrar fonética"}
            </Text>
          </Pressable>
        </Row>

        {/* Leyenda de iconos */}
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

        {/* Carrusel de frases */}
        {list.length > 0 && (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePageChange}
          >
            {list.map((it) => (
              <View key={it.id} style={{ width: SCREEN_WIDTH }}>
                <View
                  style={[
                    S.card,
                    playingId === it.id && S.cardActive,
                  ]}
                >
                  {/* Categoría */}
                  {it.category && (
                    <Text style={S.sectionHead}>{it.category}</Text>
                  )}

                  {/* Inspector */}
                  <Text style={[S.tag, { marginTop: 6 }]}>Inspector</Text>
                  <Text style={S.line}>{it.inspector_en}</Text>
                  <Text style={S.sub}>{it.inspector_es}</Text>
                  {showPhonetics && !!it.inspector_es_phonetics && (
                    <Text style={S.phon}>{it.inspector_es_phonetics}</Text>
                  )}
                  <Row wrap>
                    <Btn
                      label="🎧 🇺🇸"
                      onPress={() => playInspector(it, "en")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🎧 🇨🇴"
                      onPress={() => playInspector(it, "es")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇺🇸"
                      onPress={() => playInspector(it, "en", true)}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇨🇴"
                      onPress={() => playInspector(it, "es", true)}
                      disabled={autoPlay}
                    />
                  </Row>

                  {/* Conductor */}
                  <Text style={[S.tag, { marginTop: 12 }]}>Conductor</Text>
                  <Text style={S.line}>{it.driver_en}</Text>
                  <Text style={S.sub}>{it.driver_es}</Text>
                  {showPhonetics && !!it.driver_es_phonetics && (
                    <Text style={S.phon}>{it.driver_es_phonetics}</Text>
                  )}
                  <Row wrap>
                    <Btn
                      label="🎙 🇺🇸"
                      onPress={() => playDriver(it, "en")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🎙 🇨🇴"
                      onPress={() => playDriver(it, "es")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇺🇸"
                      onPress={() => playDriver(it, "en", true)}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇨🇴"
                      onPress={() => playDriver(it, "es", true)}
                      disabled={autoPlay}
                    />
                  </Row>

                  <View style={S.divider} />

                  {/* Escena completa */}
                  <Text style={S.tag}>Escena completa</Text>
                  <Row wrap>
                    <Btn
                      label="▶ 🇺🇸"
                      onPress={() => playScene(it, "en")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="▶ 🇨🇴"
                      onPress={() => playScene(it, "es")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="▶ 🇺🇸+🇨🇴"
                      onPress={() => playScene(it, "both")}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇺🇸"
                      onPress={() => playScene(it, "en", true)}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇨🇴"
                      onPress={() => playScene(it, "es", true)}
                      disabled={autoPlay}
                    />
                    <Btn
                      label="🐢 🇺🇸+🇨🇴"
                      onPress={() => playScene(it, "both", true)}
                      disabled={autoPlay}
                    />
                  </Row>

                  {/* Tu práctica / notas */}
                  <Text style={S.notesLabel}>Tu práctica / notas:</Text>
                  <TextInput
                    style={S.notesInput}
                    placeholder="Escribe aquí tu versión o apuntes de la frase…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />

                  {/* Estado de completado */}
                  <View style={S.doneRow}>
                    <Text
                      style={[
                        S.doneText,
                        completed[it.id] && { color: "#22c55e" },
                      ]}
                    >
                      {completed[it.id]
                        ? "Frase completada ✓"
                        : "Marca como completada después de practicar."}
                    </Text>
                    <Pressable
                      style={[
                        S.doneBtn,
                        completed[it.id] && S.doneBtnActive,
                      ]}
                      onPress={() => markDone(it.id, true)}
                    >
                      <Text
                        style={[
                          S.doneBtnText,
                          completed[it.id] && S.doneBtnTextActive,
                        ]}
                      >
                        {completed[it.id] ? "Completado" : "Completado ✓"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* 🔹 Retroalimentación del módulo (solo cuando está 100% completado) */}
        {total > 0 && done === total && (
          <View style={S.feedbackWrapper}>
            <Text style={S.feedbackTitle}>Retroalimentación del módulo</Text>

            {feedbackLoading && (
              <Text style={S.feedbackText}>
                Generando retroalimentación personalizada…
              </Text>
            )}

            {!feedbackLoading && feedback && (
              <>
                <Text style={S.feedbackText}>{feedback}</Text>

                {/* CTA de lujo hacia el examen */}
                <Pressable
                  style={S.examBtn}
                  onPress={() => router.push("/exam-m2")}
                >
                  <Text style={S.examBtnText}>
                    🚀 Ir al examen de frases con inspector
                  </Text>
                </Pressable>
              </>
            )}

            {!feedbackLoading && !feedback && (
              <Text style={S.feedbackText}>
                Completa todas las frases para recibir una retroalimentación
                personalizada.
              </Text>
            )}
          </View>
        )}

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
            <Text style={S.homeBtnText}>🏠 Volver al inicio</Text>
          </Link>
        </View>

        <View style={{ height: 16 }} />
        <RoseEmbossedSeal />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Utils */
function pause(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function Row({
  children,
  wrap,
}: {
  children: React.ReactNode;
  wrap?: boolean;
}) {
  return <View style={[S.row, wrap && { flexWrap: "wrap" }]}>{children}</View>;
}

function Btn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[S.btn, disabled && S.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={S.btnText}>{label}</Text>
    </Pressable>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  body: {
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 28,
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: { width: 120, height: 60, opacity: 0.98 },

  blockTitle: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    fontSize: 18,
    marginHorizontal: 16,
    marginVertical: 8,
  },

  progressWrap: {
    marginHorizontal: 16,
    height: 18,
    backgroundColor: "#1A1A1A",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    justifyContent: "center",
    marginBottom: 10,
  },
  progressBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#E6B7C8",
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 11,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginHorizontal: 16,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
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
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
  },
  cardActive: {
    borderColor: "#E6B7C8",
    shadowColor: "#E6B7C8",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },

  sectionHead: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  tag: { color: ROSEN.colors.roseDeep, fontWeight: "900" },
  line: { color: "#FFFFFF", marginTop: 4 },
  sub: { color: "#9CA3AF", marginTop: 2 },
  phon: {
    color: ROSEN.colors.roseDeep,
    marginTop: 2,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 10,
  },

  btn: {
    backgroundColor: "#0a84ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#fff", fontWeight: "800" },

  toggle: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    flex: 1,
  },
  toggleOff: {
    borderColor: ROSEN.colors.roseDeep,
    backgroundColor: "transparent",
  },
  toggleOn: {
    borderColor: ROSEN.colors.roseDeep,
    backgroundColor: "rgba(230,183,200,0.14)",
  },
  toggleText: { color: ROSEN.colors.roseDeep, fontWeight: "800" },
  toggleOnText: { color: "#fff", fontWeight: "900" },

  notesLabel: {
    marginTop: 10,
    color: "#9CA3AF",
    fontSize: 12,
  },
  notesInput: {
    marginTop: 4,
    backgroundColor: "#111111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 50,
  },

  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
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

  // 🔹 Bloque de feedback IA
  feedbackWrapper: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,183,200,0.5)",
    backgroundColor: "rgba(24,24,24,0.9)",
  },
  feedbackTitle: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 14,
  },
  feedbackText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
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
