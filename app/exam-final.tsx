// app/exam-final.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import examRaw from "../content/exam_final.json";
import { ROSEN } from "../lib/rosen";
import { setProgressFlag } from "../services/progress";
import { speak } from "../services/voice";

const STORAGE_KEY = "elvia_exam_final_result";

// 🔹 Color de acento centralizado: usa SOLYON (ROSEN.colors.accent) si existe
// y si no, cae en dorado por compatibilidad.
const ACCENT_COLOR =
  ((ROSEN as any).colors && (ROSEN as any).colors.accent) || "#FFD700";

// -------------------- Tipos de pregunta --------------------

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

type Question = TranslationMC | AudioMC | FillQuestion | OrderQuestion;

type FinalResultStored = {
  fullName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

// -------------------- Normalizar JSON --------------------

function normalizeQuestions(raw: any): Question[] {
  const data = Array.isArray(raw) ? raw : raw?.questions ?? [];

  return (data as any[]).map((q, index) => {
    const base: BaseQuestion = {
      id: q.id ?? `q-${index + 1}`,
      type: q.type ?? "translation_mc",
    };

    if (q.type === "audio_mc") {
      const audio: AudioMC = {
        ...base,
        type: "audio_mc",
        prompt: q.prompt ?? "Escucha el audio y selecciona la respuesta correcta.",
        audioText: q.audioText ?? q.text ?? "",
        options: q.options ?? [],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
      };
      return audio;
    }

    if (q.type === "fill") {
      const fill: FillQuestion = {
        ...base,
        type: "fill",
        question: q.question ?? "",
        answer: q.answer ?? "",
      };
      return fill;
    }

    if (q.type === "order") {
      const order: OrderQuestion = {
        ...base,
        type: "order",
        question: q.question ?? "",
        chunks: q.chunks ?? [],
        answer: q.answer ?? [],
      };
      return order;
    }

    const translation: TranslationMC = {
      ...base,
      type: "translation_mc",
      question: q.question ?? q.text ?? "",
      options: q.options ?? [],
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
    };

    return translation;
  });
}

// -------------------- Pantalla principal --------------------

export default function ExamFinalScreen() {
  const router = useRouter();

  const questions = useMemo<Question[]>(() => normalizeQuestions(examRaw), []);

  const [answers, setAnswers] = useState<any[]>(
    () => new Array(questions.length).fill(null)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<FinalResultStored | null>(null);

  useEffect(() => {
    if (!questions.length) {
      Alert.alert(
        "Examen sin contenido",
        "No se encontraron preguntas para el examen final. Revisa el archivo exam_final.json."
      );
    }
  }, [questions]);

  // Cargar resultado previo (si existe) y asegurarnos de marcar exam_cert_passed si ya aprobó
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: FinalResultStored = JSON.parse(raw);
          setLastResult(stored);

          if (stored.score >= 80) {
            // Garantizamos que exam_cert_passed quede marcado aunque la app se haya cerrado
            await setProgressFlag("exam_cert_passed", true);
          }
        }
      } catch (err) {
        console.error("[EXAM-FINAL] Error leyendo resultado previo:", err);
      }
    })();
  }, []);

  const currentQuestion = questions[currentIndex];

  // -------------------- Helpers de respuesta --------------------

  const isAnswered = (q: Question, ans: any): boolean => {
    if (q.type === "translation_mc" || q.type === "audio_mc") {
      return typeof ans === "number" && ans >= 0;
    }
    if (q.type === "fill") {
      return typeof ans === "string" && ans.trim().length > 0;
    }
    if (q.type === "order") {
      return Array.isArray(ans) && ans.length === q.chunks.length;
    }
    return false;
  };

  const isCurrentAnswered = (): boolean => {
    const q = currentQuestion;
    const ans = answers[currentIndex];
    return isAnswered(q, ans);
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  };

  const handleFillChange = (text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = text;
      return next;
    });
  };

  const handleOrderSelectChunk = (chunk: string) => {
    const q = currentQuestion;
    if (q.type !== "order") return;

    setAnswers((prev) => {
      const next = [...prev];
      const currentSeq: string[] = Array.isArray(next[currentIndex])
        ? next[currentIndex]
        : [];

      if (currentSeq.length >= q.chunks.length) return next;

      next[currentIndex] = [...currentSeq, chunk];
      return next;
    });
  };

  const handleOrderReset = () => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = [];
      return next;
    });
  };

  // -------------------- Navegación --------------------

  const handleNext = () => {
    if (!isCurrentAnswered()) {
      Alert.alert("Pregunta sin responder", "Responde antes de continuar.");
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((idx) => idx - 1);
  };

  // -------------------- Finalizar examen --------------------

  const handleFinish = async () => {
    // Verificar que TODAS estén respondidas
    const hasPending = questions.some((q, idx) => !isAnswered(q, answers[idx]));
    if (hasPending) {
      Alert.alert(
        "Preguntas pendientes",
        "Aún tienes preguntas sin responder. Revisa antes de finalizar."
      );
      return;
    }

    try {
      setSubmitting(true);

      let correctAnswers = 0;

      questions.forEach((q, index) => {
        const ans = answers[index];

        if (q.type === "translation_mc" || q.type === "audio_mc") {
          if (typeof ans === "number" && ans === q.correctIndex) {
            correctAnswers += 1;
          }
        } else if (q.type === "fill") {
          const user = (ans ?? "").toString().trim().toLowerCase();
          const correct = q.answer.trim().toLowerCase();
          if (user === correct) {
            correctAnswers += 1;
          }
        } else if (q.type === "order") {
          const seq: string[] = Array.isArray(ans) ? ans : [];
          if (
            seq.length === q.answer.length &&
            seq.every((val, i) => val === q.answer[i])
          ) {
            correctAnswers += 1;
          }
        }
      });

      const totalQuestions = questions.length;
      const score = (correctAnswers / totalQuestions) * 100;

      const resultToStore: FinalResultStored = {
        fullName: "",
        score,
        correctAnswers,
        totalQuestions,
        completedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resultToStore));
      setLastResult(resultToStore);

      // Si aprobó, marcamos examen certificable como aprobado en progreso global
      if (score >= 80) {
        try {
          await setProgressFlag("exam_cert_passed", true);
        } catch (err) {
          console.error("[EXAM-FINAL] Error marcando exam_cert_passed:", err);
        }
      }

      // Navegamos a la pantalla de certificado
      router.push("/exam-certificate");
    } catch (error) {
      console.error("Error guardando resultado de examen final:", error);
      Alert.alert(
        "Error",
        "No fue posible guardar el resultado del examen. Intenta nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAudio = () => {
    if (currentQuestion.type === "audio_mc") {
      speak(currentQuestion.audioText);
    }
  };

  // -------------------- Render --------------------

  if (!questions.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No hay preguntas configuradas para el examen final.
          </Text>
          <Link href="/home" asChild>
            <Pressable style={[styles.buttonBase, styles.secondaryButton]}>
              <Text style={styles.buttonTextSecondary}>Volver al inicio</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const total = questions.length;
  const answeredCount = answers.filter((a, idx) =>
    isAnswered(questions[idx], a)
  ).length;
  const progress = (answeredCount / total) * 100;

  let selectedSeq: string[] = [];
  let remainingChunks: string[] = [];
  if (currentQuestion.type === "order") {
    selectedSeq = Array.isArray(answers[currentIndex])
      ? (answers[currentIndex] as string[])
      : [];
    remainingChunks = currentQuestion.chunks.filter(
      (chunk) => !selectedSeq.includes(chunk)
    );
  }

  const typeLabel =
    currentQuestion.type === "audio_mc"
      ? "Comprensión auditiva"
      : currentQuestion.type === "fill"
      ? "Completar frase"
      : currentQuestion.type === "order"
      ? "Ordenar frase"
      : "Traducción / comprensión";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.seal}>
          <RoseEmbossedSeal />
        </View>

        <Text style={styles.title}>Examen Final · EL-VÍA DOT Express</Text>
        <Text style={styles.subtitle}>
          Responde todas las preguntas con calma. Debes alcanzar mínimo{" "}
          <Text style={styles.highlight}>80%</Text> para obtener tu certificado
          oficial.
        </Text>

        {/* Barra de progreso */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {answeredCount}/{total} respondidas · {progress.toFixed(0)}%
          </Text>
        </View>

        {/* Tarjeta de pregunta */}
        <View style={styles.card}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionIndex}>
              Pregunta {currentIndex + 1} de {total}
            </Text>
            <Text style={styles.questionType}>{typeLabel}</Text>
          </View>

          {currentQuestion.type === "audio_mc" ? (
            <View>
              <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
              <Pressable
                style={[styles.buttonBase, styles.audioButton]}
                onPress={handlePlayAudio}
              >
                <Text style={styles.buttonTextPrimary}>Reproducir audio</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.questionText}>
              {currentQuestion.question}
            </Text>
          )}

          {(currentQuestion.type === "translation_mc" ||
            currentQuestion.type === "audio_mc") && (
            <View style={styles.optionsWrapper}>
              {currentQuestion.options.map((opt, index) => {
                const selected = answers[currentIndex] === index;
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.optionButton,
                      selected && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleSelectOption(index)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {currentQuestion.type === "fill" && (
            <View style={styles.fillWrapper}>
              <TextInput
                style={styles.fillInput}
                placeholder="Escribe tu respuesta en inglés"
                placeholderTextColor="#777"
                value={(answers[currentIndex] as string) ?? ""}
                onChangeText={handleFillChange}
                autoCapitalize="none"
              />
            </View>
          )}

          {currentQuestion.type === "order" && (
            <View style={styles.orderWrapper}>
              <Text style={styles.orderLabel}>Frase que estás armando:</Text>
              <View style={styles.orderRow}>
                {selectedSeq.length === 0 && (
                  <Text style={styles.orderEmpty}>
                    Toca las palabras para ordenarlas
                  </Text>
                )}
                {selectedSeq.map((chunk, idx) => (
                  <View
                    key={`${chunk}-${idx}`}
                    style={styles.orderChipSelected}
                  >
                    <Text style={styles.orderChipTextSelected}>{chunk}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.orderLabel}>Palabras disponibles:</Text>
              <View style={styles.orderRow}>
                {remainingChunks.map((chunk, idx) => (
                  <Pressable
                    key={`${chunk}-${idx}`}
                    style={styles.orderChip}
                    onPress={() => handleOrderSelectChunk(chunk)}
                  >
                    <Text style={styles.orderChipText}>{chunk}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.buttonBase, styles.orderResetButton]}
                onPress={handleOrderReset}
              >
                <Text style={styles.buttonTextSecondary}>Reiniciar orden</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Controles de navegación */}
        <View style={styles.navRow}>
          <Pressable
            style={[
              styles.buttonBase,
              styles.secondaryButton,
              currentIndex === 0 && styles.buttonDisabled,
            ]}
            disabled={currentIndex === 0}
            onPress={handlePrevious}
          >
            <Text
              style={
                currentIndex === 0
                  ? styles.buttonTextDisabled
                  : styles.buttonTextSecondary
              }
            >
              Anterior
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.buttonBase,
              styles.primaryButton,
              submitting && styles.buttonDisabled,
            ]}
            disabled={submitting}
            onPress={handleNext}
          >
            <Text style={styles.buttonTextPrimary}>
              {currentIndex === total - 1 ? "Finalizar examen" : "Siguiente"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Link href="/manual" asChild>
            <Pressable>
              <Text style={styles.footerLink}>
                ¿Dudas? Revisa el manual antes de enviar tu examen.
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------- Estilos --------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  seal: {
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#c4c4c4",
    textAlign: "center",
    marginBottom: 20,
  },
  highlight: {
    color: ACCENT_COLOR,
    fontWeight: "700",
  },
  progressWrapper: {
    marginBottom: 18,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR,
  },
  progressText: {
    fontSize: 12,
    color: "#e0e0e0",
  },
  card: {
    backgroundColor: "rgba(15,15,20,0.95)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: ACCENT_COLOR + "40",
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionIndex: {
    fontSize: 13,
    color: "#c4c4c4",
  },
  questionType: {
    fontSize: 12,
    color: ACCENT_COLOR,
  },
  questionText: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 16,
  },
  optionsWrapper: {
    marginTop: 4,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 10,
  },
  optionButtonSelected: {
    borderColor: ACCENT_COLOR,
    backgroundColor: "rgba(255,215,0,0.12)",
  },
  optionText: {
    fontSize: 14,
    color: "#e0e0e0",
  },
  optionTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  fillWrapper: {
    marginTop: 4,
  },
  fillInput: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 14,
  },
  orderWrapper: {
    marginTop: 8,
  },
  orderLabel: {
    fontSize: 12,
    color: "#c4c4c4",
    marginBottom: 4,
  },
  orderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  orderEmpty: {
    fontSize: 12,
    color: "#777777",
  },
  orderChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginRight: 6,
    marginBottom: 6,
  },
  orderChipText: {
    color: "#ffffff",
    fontSize: 13,
  },
  orderChipSelected: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    backgroundColor: "rgba(255,215,0,0.12)",
    marginRight: 6,
    marginBottom: 6,
  },
  orderChipTextSelected: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  orderResetButton: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  navRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  buttonBase: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextPrimary: {
    color: "#0b0b10",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
  },
  audioButton: {
    marginTop: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR,
  },
  footer: {
    marginTop: 8,
  },
  footerLink: {
    fontSize: 12,
    color: "#b0b0ff",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
