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
import { CertificateData, openCertificateFlow } from "../services/certificate";

type ExamResult = {
  fullName?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

const STORAGE_KEY = "elvia_exam_final_result";

// PNG para vista previa en la app
const CERT_SOURCE = require("../assets/certificates/elvia_certificate_base.png");

// PDF formulario oficial con campos de texto.
// En web, este require se resuelve a una URL estática.
const CERT_FORM_PDF_WEB: string = require("../assets/certificates/certificado_formulario.pdf");

export default function ExamCertificateScreen() {
  const router = useRouter();
  const { user, isPaid } = useAuth();
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

        // Nombre OFICIAL desde AuthContext (perfil del usuario)
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

    if (!isPaid) {
      Alert.alert(
        "Función protegida",
        "La generación de certificados está disponible solo para cuentas activas EL-VÍA (pago confirmado)."
      );
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

    const certId = buildCertificateId(updatedResult);

    // 🔹 FLUJO WEB → generar PDF real desde el formulario
    if (Platform.OS === "web") {
      try {
        // Cargamos pdf-lib solo cuando hace falta
        const { PDFDocument } = await import("pdf-lib");

        const pdfUrl = CERT_FORM_PDF_WEB;
        if (!pdfUrl) {
          throw new Error("No se pudo resolver la URL del PDF de plantilla");
        }

        const res = await fetch(pdfUrl);
        const originalPdfBytes = await res.arrayBuffer();

        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const form = pdfDoc.getForm();

        // ⚠ Asegúrate que estos nombres coincidan con los campos en Nitro
        const nameField = form.getTextField("NombreParticipante");
        const codeField = form.getTextField("CodigoCertificacion");
        const dateField = form.getTextField("FechaExpedicion");

        nameField.setText(updatedResult.fullName ?? "");
        codeField.setText(certId);
        dateField.setText(
          new Date(updatedResult.completedAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        );

        form.flatten();

        const finalPdfBytes = await pdfDoc.save();

        // Descarga en el navegador
        const blob = new Blob([finalPdfBytes as any], {
          type: "application/pdf",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Certificado_ELVIA_${updatedResult.fullName?.replace(
          /\s+/g,
          "_"
        )}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        return;
      } catch (e) {
        console.error("Error generando certificado web:", e);
        Alert.alert(
          "Error",
          "No fue posible generar el certificado automático en PDF en la versión web."
        );
        return;
      }
    }

    // 🔹 FLUJO MÓVIL → seguimos con tu lógica actual (openCertificateFlow)
    try {
      const payload: CertificateData = {
        fullName: fullName.trim(),
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        completedAt: result.completedAt,
        certificateId: certId,
      };

      await openCertificateFlow(payload);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...result, fullName: fullName.trim() })
      );
    } catch (error) {
      console.error("Error generando certificado (móvil):", error);
      Alert.alert(
        "Error",
        "No fue posible generar el certificado. Revisa la conexión o vuelve a intentarlo."
      );
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.seal}>
          <RoseEmbossedSeal />
        </View>

        <Text style={styles.title}>Certificado EL-VÍA DOT Express</Text>
        <Text style={styles.subtitle}>
          Has alcanzado el nivel de aprobación requerido. Verifica tus datos y genera tu
          certificado oficial.
        </Text>

        {/* DATOS PRINCIPALES */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre completo para el certificado</Text>

          {/* Campo NO editable */}
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

        {/* PREVIEW DEL CERTIFICADO */}
        <Text style={styles.sectionTitle}>Vista previa del certificado</Text>

        <View style={styles.previewWrapper}>
          <ImageBackground
            source={CERT_SOURCE}
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

        {/* BOTONES */}
        <View style={styles.buttonsRow}>
          <Text style={styles.helperText}>
            Al tocar el botón, se descargará tu certificado automático en PDF.
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
    backgroundColor: ROSEN.colors.black ?? "#050509",
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
    borderColor: "rgba(255,255,255,0.4)",
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
