// services/nexus.ts
const NEXUS_BASE_URL =
  "https://nexus-core-798731178244.us-central1.run.app/elvia/chat";

export type ElviaMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ElviaChatResponse = {
  ok: boolean;
  arcanum?: {
    ok: boolean;
    agentId: string;
    reply: string;
  };
  error?: string;
};

/**
 * Normaliza el texto de respuesta para que NO llegue cortado ni lleno de markdown.
 * - Elimina '**'
 * - Une saltos de línea en una sola frase
 * - Limpia espacios extra
 * - Aplica un fallback cuando la IA responde algo inútil (ej. solo "1")
 */
function normalizeReplyText(raw: string | undefined | null): string {
  if (!raw) return "";

  let reply = raw;

  console.log("[NEXUS RAW REPLY]", reply);

  // Unificar saltos de línea
  reply = reply.replace(/\r\n/g, "\n");

  // Quitar negrillas markdown '**'
  reply = reply.replace(/\*\*/g, "");

  // Colapsar múltiples saltos de línea en uno
  reply = reply.replace(/\n{2,}/g, "\n");

  // Trim de espacios al inicio y al final de cada línea
  reply = reply
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");

  // Colapsar espacios múltiples en uno solo
  reply = reply.replace(/\s{2,}/g, " ").trim();

  console.log("[NEXUS NORMALIZED REPLY]", reply);

  /**
   * Heurística de calidad:
   * - Si no aparece "2)" asumimos que NO respetó el formato de 4 puntos.
   * - O si la longitud es muy corta.
   * En esos casos devolvemos un fallback sólido para no mostrar basura al estudiante.
   */
  const hasSecondPoint = reply.includes("2)");
  const isTooShort = reply.length < 40;

  if (!hasSecondPoint || isTooShort) {
    console.warn(
      "[NEXUS] Reply sin estructura correcta o demasiado corto. Usando fallback."
    );
    reply =
      "1) Resumen del desempeño: Completaste todo el módulo con éxito y demostraste compromiso al practicar cada parte del contenido.\n" +
      "2) Qué hiciste bien: Seguiste las instrucciones, repetiste las frases y te mantuviste hasta terminar el 100% del módulo.\n" +
      "3) Qué debes mejorar: Repite las partes donde sientas que dudas en la pronunciación o comprensión, enfocándote en la claridad y el ritmo.\n" +
      "4) Recomendación concreta: Vuelve a practicar las frases más importantes en voz alta, usando el botón de escuchar y hablar hasta que te sientas totalmente seguro.";
  }

  return reply;
}

/**
 * Envía mensajes a Nexus-Core → Arcanum y devuelve SOLO el texto de respuesta,
 * ya normalizado para que la UI pueda mostrarlo sin cortes.
 */
export async function sendToNexus(
  messages: ElviaMessage[],
  agentId: string = "elvia-teacher"
): Promise<string> {
  const body = {
    agentId,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  console.log("[EL-VIA → Nexus] Enviando body:", JSON.stringify(body));

  const res = await fetch(NEXUS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // El servicio de Nexus está público, no necesitas token aquí.
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[EL-VIA → Nexus] Error HTTP:", res.status, text);
    throw new Error(
      `Error llamando a Nexus-Core: ${res.status} ${res.statusText}`
    );
  }

  const data: ElviaChatResponse = await res.json();
  console.log("[EL-VIA → Nexus] Respuesta JSON completa:", data);

  if (!data.ok || !data.arcanum) {
    console.error("[EL-VIA → Nexus] Respuesta no OK:", data);
    throw new Error(data.error || "Error en respuesta de Nexus/Arcanum");
  }

  const normalized = normalizeReplyText(data.arcanum.reply);
  return normalized;
}
