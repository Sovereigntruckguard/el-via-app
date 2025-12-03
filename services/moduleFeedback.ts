// services/moduleFeedback.ts
import { sendToNexus } from "./nexus";

type ModuleFeedbackInput = {
  studentName?: string;        // opcional
  moduleName: string;          // ej: "Frases con el inspector"
  level?: string;              // ej: "Beginner", "Intermediate"
  score?: number;              // ej: 85
  maxScore?: number;           // ej: 100
  commonErrors?: string[];     // lista de errores frecuentes
  notes?: string;              // cualquier resumen adicional
};

/**
 * Pide a Arcanum feedback corto y motivador al final de un módulo.
 * Devuelve un texto listo para mostrar al estudiante.
 */
export async function requestModuleFeedback(
  input: ModuleFeedbackInput
): Promise<string> {
  const {
    studentName,
    moduleName,
    level,
    score,
    maxScore,
    commonErrors,
    notes,
  } = input;

  const summaryLines: string[] = [];

  if (studentName) summaryLines.push(`Estudiante: ${studentName}`);
  summaryLines.push(`Módulo: ${moduleName}`);
  if (level) summaryLines.push(`Nivel: ${level}`);
  if (score !== undefined && maxScore !== undefined) {
    summaryLines.push(`Puntaje: ${score} de ${maxScore}`);
  }
  if (commonErrors && commonErrors.length > 0) {
    summaryLines.push(`Errores frecuentes: ${commonErrors.join("; ")}`);
  }
  if (notes) summaryLines.push(`Notas del sistema: ${notes}`);

  const summary = summaryLines.join("\n");

  const prompt = [
    "Actúa como EL-VIA Coach, un tutor bilingüe experto en inglés para camioneros latinos.",
    "Te doy el resumen del desempeño del estudiante en un módulo.",
    "Tu tarea es darle una retroalimentación en español:",
    "- Máximo 5 líneas.",
    "- Tono motivador, concreto y amable.",
    "- 1 frase de felicitación por lo que hizo bien.",
    "- 2-3 recomendaciones muy específicas de qué practicar.",
    "- Si tuvo muchos errores, refuerza que puede mejorar paso a paso.",
    "",
    "Resumen del módulo:",
    summary,
  ].join("\n");

  const reply = await sendToNexus(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    "elvia-teacher"
  );

  return reply;
}
