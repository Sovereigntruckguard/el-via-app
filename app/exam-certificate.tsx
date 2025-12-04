// app/exam-certificate.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoseEmbossedSeal from "../components/RoseEmbossedSeal";
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";

type ExamResult = {
  fullName?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

const STORAGE_KEY = "elvia_exam_final_result";

// Imagen de certificado en `public/certificates/elvia_certificate_base.png`
const CERT_WEB_PATH = "/certificates/elvia_certificate_base.png";

const getCertSource = () => {
  if (Platform.OS === "web") {
    return { uri: CERT_WEB_PATH };
  }
  // Para la preview en la app nativa, si quieres reutilizar el asset
  return require("../assets/certificates/elvia_certificate_base.png");
};

export default function ExamCertificateScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          Alert.alert(
            "Sin resultados",
            "No encontramos un resultado de examen final. Por favor completa el examen antes de generar el certificado.",
            [{ text: "Ir al examen", onPress: () => router.replace("/exam-final") }]
          );
          return;
        }

        const parsed: ExamResult = JSON.parse(stored);

        const authName =
          user?.name && user.name.trim().length > 0 ? user.name.trim() : "";

        setResult(parsed);
        setFullName(authName);
      } catch (error) {
        console.error("Error leyendo resultado de examen:", error);
        Alert.alert(
          "Error",
          "Ocurrió un problema leyendo la información del examen. Intenta nuevamente."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [router, user]);

  const handleGenerate = async () => {
    if (!result) {
      Alert.alert("Sin datos", "No hay datos de examen para generar el certificado.");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert(
        "Nombre no configurado",
        "Debes configurar tu nombre completo en tu perfil antes de generar el certificado."
      );
      return;
    }

    const updatedResult: ExamResult = {
      ...result,
      fullName: fullName.trim(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResult));

    if (Platform.OS === "web") {
      const imgUrl = window.location.origin + CERT_WEB_PATH;
      const nameText = updatedResult.fullName;
      const dateText = new Date(updatedResult.completedAt).toLocaleDateString(
        "es-ES",
        { day: "2-digit", month: "long", year: "numeric" }
      );
      const certId = buildCertificateId(updatedResult);

      const win = window.open("", "_blank", "width=1200,height=900");
      if (!win) return;

      win.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Certificado EL-VÍA</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                margin: 0;
                padding: 0;
                background: #000;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }
              .page {
                width: 100vw;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .cert-container {
                position: relative;
                width: 100%;
                height: 100%;
              }
              .cert-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
              }

              /* Nombre: justo debajo de "Se otorga el presente reconocimiento a" */
              .cert-name {
                position: absolute;
                left: 0;
                right: 0;
                top: 52%;
                text-align: center;
                color: #ffffff;
                font-size: 26px;
                font-weight: 700;
              }

              /* Código: parte superior derecha, donde dice "Código de certificación:" en la imagen */
              .cert-code {
                position: absolute;
                right: 15%;
                top: 12%;
                color: #ffffff;
                font-size: 14px;
                font-weight: 500;
              }

              /* Fecha: parte inferior izquierda, donde dice "Fecha de expedición:" en la imagen */
              .cert-date {
                position: absolute;
                left: 23%;
                bottom: 8%;
                color: #ffffff;
                font-size: 14px;
                font-weight: 500;
              }

              @media print {
                @page {
                  size: landscape;
                  margin: 0;
                }
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="cert-container">
                <img src="${imgUrl}" alt="Certificado EL-VÍA" />
                <div class="cert-name">${nameText}</div>
                <div class="cert-code">${certId}</div>
                <div class="cert-date">${dateText}</div>
              </div>
            </div>
          </body>
        </html>
      `);

      win.document.close();
      win.focus();
      win.print();
      return;
    }

    Alert.alert(
      "Disponible en versión web",
      "Puedes descargar tu certificado como PDF desde la versión web de EL-VÍA."
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Cargando certificado...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No encontramos datos de examen final para generar el certificado.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const certSource = getCertSource();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.seal}>
          <RoseEmbossedSeal />
        </View>

        <Text style={styles.title}>Certificado EL-VÍA DOT Express</Text>
        <Text style={styles.subtitle}>
          Has alcanzado el nivel de aprobación requerido. Verifica tus datos y
          genera tu certificado oficial.
        </Text>

        {/* Datos previos (pantalla, NO impresión) */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre completo para el certificado</Text>
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyText}>
              {fullName || "Configura tu nombre en el perfil"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { marginRight: 8 }]}>
              <Text style={styles.statLabel}>Puntaje</Text>
              <Text style={styles.statValue}>{result.score.toFixed(1)}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Respuestas correctas</Text>
              <Text style={styles.statValue}>
                {result.correctAnswers}/{result.totalQuestions}
              </Text>
            </View>
          </View>

          <Text style={styles.smallText}>
            Fecha de aprobación:{" "}
            {new Date(result.completedAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* PREVIEW del certificado con puntaje */}
        <Text style={styles.sectionTitle}>Vista previa del certificado</Text>
        <View style={styles.previewWrapper}>
          <ImageBackground
            source={certSource}
            style={styles.previewImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.previewOverlay}>
              <Text style={styles.previewTitle}>CERTIFICADO OFICIAL EL-VÍA</Text>
              <Text style={styles.previewName}>
                {fullName.trim() || "Nombre del participante"}
              </Text>
              <Text style={styles.previewScore}>
                Puntaje: {result.score.toFixed(1)}% · {result.correctAnswers}/
                {result.totalQuestions} correctas
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Botones */}
        <View style={styles.buttonsRow}>
          <Text style={styles.helperText}>
            Al tocar el botón, se abrirá la vista de impresión para guardar tu
            certificado como PDF.
          </Text>

          <View style={styles.actionsRow}>
            <Text
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.replace("/home")}
            >
              Volver al inicio
            </Text>
            <Text style={[styles.button, styles.primaryButton]} onPress={handleGenerate}>
              Generar PDF ahora
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildCertificateId(result: ExamResult): string {
  const datePart = new Date(result.completedAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ELVIA-${datePart}-${random}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ROSEN.colors.black ?? "#000000",
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
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
  },
  seal: {
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#c4c4c4",
    textAlign: "center",
    marginBottom: 22,
  },
  card: {
    backgroundColor: "rgba(15,15,20,0.95)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    marginBottom: 24,
  },
  label: {
    color: "#f5f5f5",
    fontSize: 13,
    marginBottom: 6,
  },
  readonlyField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  readonlyText: {
    color: "#ffffff",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statLabel: {
    fontSize: 11,
    color: "#c4c4c4",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  smallText: {
    fontSize: 11,
    color: "#a5a5a5",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 10,
  },
  previewWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 24,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "center",
    alignItems: "center",
  },
  previewOverlay: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  previewTitle: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#f5f5f5",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  previewName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  previewScore: {
    fontSize: 13,
    color: "#e0e0e0",
  },
  buttonsRow: {
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#cccccc",
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  button: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#FFD700",
    color: "#0b0b10",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginRight: 8,
  },
});
