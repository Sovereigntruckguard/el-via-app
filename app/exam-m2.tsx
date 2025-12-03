// app/exam-m2.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { setProgressFlag } from "../services/progress";
import { speak } from "../services/voice";

type BaseQuestion = {
  id: string;
  type: string;
};

type TranslationMC = BaseQuestion & {
  type: "translation_mc";
  question: string;
  options: string[];
  correctIndex: number;
};

type AudioMC = BaseQuestion & {
  type: "audio_mc";
  prompt: string;
  audioText: string;
  options: string[];
  correctIndex: number;
};

type FillQuestion = BaseQuestion & {
  type: "fill";
  question: string;
  answer: string;
};

type OrderQuestion = BaseQuestion & {
  type: "order";
  question: string;
  chunks: string[];
  answer: string[];
};

type ExamQuestion = TranslationMC | AudioMC | FillQuestion | OrderQuestion;

const STORAGE_KEY = "elvia:exam:m2";

type ExamResult = {
  bestScore: number;
  attempts: number;
  passed: boolean;
};

export default function ExamM2() {
  const router = useRouter();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [orderSelected, setOrderSelected] = useState<string[]>([]);
  const [orderAvailable, setOrderAvailable] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    (async () => {
      const mod = await import("../content/exam_m2.json");
      const arr = (mod.default || mod) as ExamQuestion[];
      setQuestions(arr);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    const q = questions[current];
    if (!q) return;
    const saved = answers[q.id];

    setSelectedIndex(saved?.selectedIndex ?? null);
    setFillValue(saved?.fillValue ?? "");
    if (q.type === "order") {
      setOrderAvailable(saved?.orderAvailable ?? q.chunks);
      setOrderSelected(saved?.orderSelected ?? []);
    } else {
      setOrderAvailable([]);
      setOrderSelected([]);
    }
  }, [current, questions]);

  const total = questions.length;
  const progressPct = total ? Math.round(((current + 1) / total) * 100) : 0;

  const currentQuestion = questions[current];

  const saveAnswer = (partial?: boolean) => {
    if (!currentQuestion) return;
    const id = currentQuestion.id;

    setAnswers((prev) => {
      const next = {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          selectedIndex,
          fillValue,
          orderSelected,
          orderAvailable,
        },
      };
      return next;
    });

    if (partial) return;

    if (current + 1 < total) {
      setCurrent((c) => c + 1);
    } else {
      evaluateExam();
    }
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    if (
      currentQuestion.type === "translation_mc" ||
      currentQuestion.type === "audio_mc"
    ) {
      if (selectedIndex === null) {
        Alert.alert(
          "Respuesta requerida",
          "Selecciona una opción para continuar."
        );
        return;
      }
    } else if (currentQuestion.type === "fill") {
      if (!fillValue.trim()) {
        Alert.alert(
          "Respuesta requerida",
          "Escribe tu respuesta antes de continuar."
        );
        return;
      }
    } else if (currentQuestion.type === "order") {
      if (orderSelected.length !== currentQuestion.chunks.length) {
        Alert.alert(
          "Respuesta incompleta",
          "Ordena todas las palabras antes de continuar."
        );
        return;
      }
    }

    saveAnswer();
  };

  const handlePrev = () => {
    if (current === 0) return;
    saveAnswer(true);
    setCurrent((c) => c - 1);
  };

  const evaluateExam = async () => {
    let correct = 0;

    for (const q of questions) {
      const a = answers[q.id];
      if (!a) continue;

      if (q.type === "translation_mc" || q.type === "audio_mc") {
        if (a.selectedIndex === q.correctIndex) correct++;
      } else if (q.type === "fill") {
        const user = String(a.fillValue || "").trim().toLowerCase();
        const expected = q.answer.trim().toLowerCase();
        if (user === expected) correct++;
      } else if (q.type === "order") {
        const userArr = a.orderSelected as string[];
        if (
          userArr &&
          userArr.length === q.answer.length &&
          userArr.every((chunk, idx) => chunk === q.answer[idx])
        ) {
          correct++;
        }
      }
    }

    const pct = total ? Math.round((correct / total) * 100) : 0;
    setScore(pct);
    setFinished(true);

    const passed = pct >= 80;
    const next: ExamResult = {
      bestScore: Math.max(result?.bestScore ?? 0, pct),
      attempts: (result?.attempts ?? 0) + 1,
      passed,
    };
    setResult(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // 🔹 Si aprobó, marcamos el examen del Módulo 2 como aprobado en el progreso global
    if (passed) {
      try {
        await setProgressFlag("exam_phrases_passed", true);
      } catch (err) {
        console.error("[EXAM-M2] Error marcando exam_phrases_passed:", err);
      }
    }
  };

  const resetExam = () => {
    setAnswers({});
    setCurrent(0);
    setScore(null);
    setFinished(false);
    setSelectedIndex(null);
    setFillValue("");
    setOrderAvailable([]);
    setOrderSelected([]);
  };

  const handleOrderSelect = (chunk: string) => {
    setOrderAvailable((prev) => prev.filter((c) => c !== chunk));
    setOrderSelected((prev) => [...prev, chunk]);
  };

  const handleOrderRemove = (chunk: string) => {
    setOrderSelected((prev) => prev.filter((c) => c !== chunk));
    setOrderAvailable((prev) => [...prev, chunk]);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    if (finished && score !== null) {
      const passed = score >= 80;
      return (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            {passed
              ? "✅ Aprobaste el examen del Módulo 2"
              : "⚠ No alcanzaste el 80%"}
          </Text>
          <Text style={styles.resultScore}>Tu puntaje: {score}%</Text>
          {result && (
            <Text style={styles.resultSub}>
              Mejores resultados: {result.bestScore}% · Intentos:{" "}
              {result.attempts}
            </Text>
          )}
          <Text style={styles.resultText}>
            {passed
              ? "Estás listo para avanzar al Módulo 3. Puedes repetir el examen cuando quieras para reforzar."
              : "Te recomendamos repetir el examen para consolidar las frases clave con el inspector. También puedes avanzar y volver luego."}
          </Text>

          <View style={styles.rowButtons}>
            <ExamButton label="🔁 Repetir examen" onPress={resetExam} />
            <ExamButton
              label="📘 Volver al Módulo 2"
              onPress={() => router.push("/training")}
            />
          </View>

          <View style={styles.rowButtons}>
            <ExamButton
              label="➡ Ir al Módulo 3"
              onPress={() => router.push("/glossary")}
            />
          </View>
        </View>
      );
    }

    switch (currentQuestion.type) {
      case "translation_mc": {
        const q = currentQuestion as TranslationMC;
        return (
          <View style={styles.card}>
            <Text style={styles.qTitle}>Traducción</Text>
            <Text style={styles.qText}>{q.question}</Text>
            <View style={styles.optWrap}>
              {q.options.map((opt, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.option,
                    selectedIndex === idx && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedIndex(idx)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedIndex === idx && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }
      case "audio_mc": {
        const q = currentQuestion as AudioMC;
        return (
          <View style={styles.card}>
            <Text style={styles.qTitle}>Comprensión auditiva</Text>
            <Text style={styles.qText}>{q.prompt}</Text>
            <Pressable
              style={styles.audioBtn}
              onPress={() => speak(q.audioText, { lang: "en", rate: 0.95 })}
            >
              <Text style={styles.audioBtnText}>▶ Escuchar audio</Text>
            </Pressable>
            <View style={styles.optWrap}>
              {q.options.map((opt, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.option,
                    selectedIndex === idx && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedIndex(idx)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedIndex === idx && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }
      case "fill": {
        const q = currentQuestion as FillQuestion;
        return (
          <View style={styles.card}>
            <Text style={styles.qTitle}>Completar frase</Text>
            <Text style={styles.qText}>{q.question}</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu respuesta en inglés…"
              placeholderTextColor="#9CA3AF"
              value={fillValue}
              onChangeText={setFillValue}
            />
          </View>
        );
      }
      case "order": {
        const q = currentQuestion as OrderQuestion;
        return (
          <View style={styles.card}>
            <Text style={styles.qTitle}>Ordenar palabras</Text>
            <Text style={styles.qText}>{q.question}</Text>

            <Text style={styles.orderLabel}>Tu frase:</Text>
            <View style={styles.orderRow}>
              {orderSelected.map((chunk, idx) => (
                <Pressable
                  key={`${chunk}-${idx}`}
                  style={[styles.chip, styles.chipSelected]}
                  onPress={() => handleOrderRemove(chunk)}
                >
                  <Text style={styles.chipText}>{chunk}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.orderLabel}>Palabras disponibles:</Text>
            <View style={styles.orderRow}>
              {orderAvailable.map((chunk, idx) => (
                <Pressable
                  key={`${chunk}-${idx}`}
                  style={styles.chip}
                  onPress={() => handleOrderSelect(chunk)}
                >
                  <Text style={styles.chipText}>{chunk}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Examen – Módulo 2 (Frases con inspector)
        </Text>
        <Text style={styles.subtitle}>
          Demuestra que dominas las frases clave de saludo, cortesía y solicitud
          de documentos.
        </Text>

        {total > 0 && !finished && (
          <View style={styles.progressBox}>
            <View style={styles.progressOuter}>
              <View
                style={[styles.progressInner, { width: `${progressPct}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              Pregunta {current + 1} de {total} · {progressPct}%
            </Text>
          </View>
        )}

        {renderQuestion()}

        {!finished && total > 0 && (
          <View style={styles.navRow}>
            <ExamButton
              label="⏮ Anterior"
              onPress={handlePrev}
              disabled={current === 0}
            />
            <ExamButton
              label={current + 1 === total ? "✅ Finalizar" : "⏭ Siguiente"}
              onPress={handleNext}
            />
          </View>
        )}

        <View style={{ height: 16 }} />
        <Link href="/manual" style={styles.backBtn}>
          <Text style={styles.backBtnText}>📚 Volver al plan 7 días</Text>
        </Link>
        <View style={{ height: 16 }} />
        <RoseEmbossedSeal />
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamButton({
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
      style={[styles.examBtn, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.examBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  container: { flex: 1, backgroundColor: ROSEN.colors.black },
  body: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 28 },

  title: {
    color: ROSEN.colors.white,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: { color: ROSEN.colors.mute, marginBottom: 12 },

  progressBox: { marginBottom: 12 },
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

  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 14,
    marginBottom: 14,
  },
  qTitle: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "900",
    marginBottom: 4,
  },
  qText: { color: ROSEN.colors.white, marginBottom: 10 },

  optWrap: { gap: 8, marginTop: 4 },
  option: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#141414",
  },
  optionSelected: {
    backgroundColor: ROSEN.colors.rose,
    borderColor: ROSEN.colors.roseDeep,
  },
  optionText: { color: ROSEN.colors.mute, fontWeight: "600" },
  optionTextSelected: { color: "#181818" },

  audioBtn: {
    alignSelf: "flex-start",
    marginVertical: 8,
    backgroundColor: "#0a84ff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  audioBtnText: { color: "#fff", fontWeight: "800" },

  input: {
    backgroundColor: "#121212",
    color: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 10,
    marginTop: 8,
  },

  orderLabel: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    marginTop: 6,
  },
  orderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "#141414",
  },
  chipSelected: {
    backgroundColor: ROSEN.colors.rose,
    borderColor: ROSEN.colors.roseDeep,
  },
  chipText: { color: "#fff", fontWeight: "700" },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  examBtn: {
    flex: 1,
    backgroundColor: "#0a84ff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  examBtnText: { color: "#fff", fontWeight: "900" },

  resultCard: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    color: ROSEN.colors.white,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  resultScore: { color: ROSEN.colors.rose, fontWeight: "800", marginBottom: 4 },
  resultSub: { color: ROSEN.colors.mute, marginBottom: 8 },
  resultText: { color: ROSEN.colors.mute, lineHeight: 20 },
  rowButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  backBtn: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignSelf: "center",
  },
  backBtnText: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "800",
  },
});
