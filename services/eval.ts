// services/eval.ts
import { sendToNexus } from "./nexus";

/* ============================
   EVAL LOCAL (SIMILARITY + GRADE)
   ============================ */

function norm(s?: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a: string, b: string) {
  const A = norm(a).split(" ");
  const B = norm(b).split(" ");
  if (!A.length || !B.length) return 0;
  const setB = new Set(B);
  let hit = 0;
  for (const t of A) if (setB.has(t)) hit++;
  const tokenScore = hit / Math.max(A.length, B.length);
  // bonus por prefijo largo común
  const pref = commonPrefix(norm(a), norm(b)).length;
  const prefScore = Math.min(pref / 20, 0.3);
  return Math.max(0, Math.min(1, tokenScore * 0.8 + prefScore));
}

function commonPrefix(a: string, b: string) {
  const L = Math.min(a.length, b.length);
  let i = 0;
  for (; i < L && a[i] === b[i]; i++) {}
  return a.slice(0, i);
}

export function grade(user: string, expected: string) {
  const s = similarity(user, expected);
  if (s >= 0.9) return { ok: true, score: s, label: "Excelente" };
  if (s >= 0.75) return { ok: true, score: s, label: "Muy bien" };
  if (s >= 0.6) return { ok: false, score: s, label: "Casi. Repite" };
  return { ok: false, score: s, label: "Practica más" };
}

/* ============================
   EVAL IA (NEXUS → ARCANUM)
   ============================ */

export type ModuleFeedbackParams = {
  moduleName: string;   // Ej: "Módulo 2 - Señales DOT"
  studentName?: string;
  score: number;        // 0 a 100
  strengths: string[];  // Puntos fuertes del módulo
  mistakes: string[];   // Errores / temas débiles
};

/**
 * Genera retroalimentación personalizada al final de un módulo,
 * usando el agente "elvia-teacher" en Arcanum vía Nexus-Core.
 */
export async function getModuleFeedback(
  params: ModuleFeedbackParams
): Promise<string> {
  const { moduleName, studentName, score, strengths, mistakes } = params;

  const summaryText = [
    `Estudiante: ${studentName || "Estudiante EL-VIA"}`,
    `Módulo completado: ${moduleName}`,
    `Puntaje final: ${score}/100`,
    "",
    "Puntos fuertes del estudiante en este módulo:",
    strengths.length > 0
      ? strengths.map((s) => `- ${s}`).join("\n")
      : "- Ninguno registrado.",
    "",
    "Errores o temas que le costaron al estudiante:",
    mistakes.length > 0
      ? mistakes.map((m) => `- ${m}`).join("\n")
      : "- No se registraron errores.",
    "",
    "Genera una retroalimentación corta (máx. 6 líneas), en español sencillo, con este formato:",
    "1) Resumen del desempeño",
    "2) Qué hizo bien",
    "3) Qué debe mejorar",
    "4) Una recomendación concreta para el próximo módulo",
  ].join("\n");

  const reply = await sendToNexus(
    [
      {
        role: "user",
        content: summaryText,
      },
    ],
    "elvia-teacher"
  );

  return reply;
}
