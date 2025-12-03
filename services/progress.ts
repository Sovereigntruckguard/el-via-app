// services/progress.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ELVIA_PROGRESS_KEY = "elvia:course:progress:v1";

export type ModuleProgressFlags = {
  // Módulos de aprendizaje
  m1_phrases_completed: boolean;        // Frases con inspector
  m2_pronunciation_completed: boolean;  // Pronunciación
  m3_signals_completed: boolean;        // Señales de tránsito
  m4_roleplays_completed: boolean;      // Roleplays

  // Exámenes
  exam_phrases_passed: boolean;         // Examen frases con inspector
  exam_signals_passed: boolean;         // Examen señales
  exam_cert_passed: boolean;            // Examen certificable final
};

const DEFAULT_PROGRESS: ModuleProgressFlags = {
  m1_phrases_completed: false,
  m2_pronunciation_completed: false,
  m3_signals_completed: false,
  m4_roleplays_completed: false,
  exam_phrases_passed: false,
  exam_signals_passed: false,
  exam_cert_passed: false,
};

/**
 * Carga el progreso completo del curso desde AsyncStorage.
 * Si no existe nada, devuelve el objeto por defecto.
 */
export async function loadCourseProgress(): Promise<ModuleProgressFlags> {
  try {
    const raw = await AsyncStorage.getItem(ELVIA_PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);

    // Mezclamos con DEFAULT por si agregamos nuevos flags en el futuro
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch (err) {
    console.error("[PROGRESS] Error leyendo progreso:", err);
    return { ...DEFAULT_PROGRESS };
  }
}

/**
 * Guarda el objeto completo de progreso.
 */
export async function saveCourseProgress(
  progress: ModuleProgressFlags
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ELVIA_PROGRESS_KEY,
      JSON.stringify(progress)
    );
  } catch (err) {
    console.error("[PROGRESS] Error guardando progreso:", err);
  }
}

/**
 * Marca un flag específico (módulo o examen) como true/false
 * y devuelve el objeto actualizado.
 */
export async function setProgressFlag(
  flag: keyof ModuleProgressFlags,
  value: boolean
): Promise<ModuleProgressFlags> {
  const current = await loadCourseProgress();
  const updated: ModuleProgressFlags = { ...current, [flag]: value };
  await saveCourseProgress(updated);
  console.log("[PROGRESS] Flag actualizado:", flag, "=", value);
  return updated;
}

/**
 * Devuelve true si TODOS los módulos de aprendizaje están completos.
 */
export function areLearningModulesCompleted(p: ModuleProgressFlags): boolean {
  return (
    p.m1_phrases_completed &&
    p.m2_pronunciation_completed &&
    p.m3_signals_completed &&
    p.m4_roleplays_completed
  );
}

/**
 * Devuelve true si TODOS los requisitos para el examen certificable se cumplen.
 */
export function canTakeCertExam(p: ModuleProgressFlags): boolean {
  return (
    areLearningModulesCompleted(p) &&
    p.exam_phrases_passed &&
    p.exam_signals_passed
  );
}

/**
 * Devuelve true si TODO el curso está completado, incluyendo el examen final.
 */
export function isCourseFullyCompleted(p: ModuleProgressFlags): boolean {
  return canTakeCertExam(p) && p.exam_cert_passed;
}
