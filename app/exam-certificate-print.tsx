// app/exam-certificate-print.tsx
// Pantalla dedicada a IMPRIMIR el certificado en WEB
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
const CERT_SOURCE = require("../assets/certificates/elvia_certificate_base.png");

export default function ExamCertificatePrintScreen() {
  const { user } = useAuth();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [ready, setReady] = useState(false);

  // Cargar datos del examen desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return;
        }
        const parsed: ExamResult = JSON.parse(stored);
        setResult(parsed);
      } catch (e) {
        console.log("[CERT_PRINT] Error leyendo resultado:", e);
      }
    })();
  }, []);

  // Cuando hay datos y ya se renderizó al menos una vez, disparamos print en web
  useEffect(() => {
    if (Platform.OS === "web" && result && ready && typeof window !== "undefined") {
      const id = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(id);
    }
  }, [result, ready]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Preparando certificado…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    (result.fullName && result.fullName.trim()) ||
    (user?.name && user.name.trim()) ||
    "Nombre del participante";

  const fecha = new Date(result.completedAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Código simple; si quieres, luego usamos tu lógica de código oficial
  const certCode = `ELVIA-${new Date(result.completedAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;

  const { width } = Dimensions.get("window");
  const certWidth = Math.min(width - 32, 1200);
  const aspect = 832 / 1248; // proporción real aproximada de tu diseño
  const certHeight = certWidth * aspect;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root} onLayout={() => setReady(true)}>
        <View style={{ width: certWidth, height: certHeight }}>
          <ImageBackground
            source={CERT_SOURCE}
            style={styles.bg}
            imageStyle={{ resizeMode: "cover" }}
          >
            {/* Overlay con nombre, fecha y código */}
            <View style={styles.overlay}>
              {/* Código de certificación arriba derecha */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Código de certificación:</Text>
                <Text style={styles.codeValue}>{certCode}</Text>
              </View>

              {/* Nombre en el centro */}
              <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{fullName}</Text>
              </View>

              {/* Fecha abajo centro */}
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Fecha de expedición:</Text>
                <Text style={styles.dateValue}>{fecha}</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ROSEN.colors.black ?? "#000000",
  },
  root: {
    flex: 1,
    backgroundColor: ROSEN.colors.black ?? "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  loadingText: {
    color: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Código de certificación (arriba derecha, dentro del marco)
  codeContainer: {
    position: "absolute",
    top: 40, // ajusta fino según tu marco
    right: 80,
    alignItems: "flex-end",
  },
  codeLabel: {
    color: "#ffffff",
    fontSize: 14,
  },
  codeValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Nombre centrado (en la zona que definiste)
  nameContainer: {
    position: "absolute",
    top: "49%", // SUBE o BAJA este valor para posicionarlo exacto
    left: 0,
    right: 0,
    alignItems: "center",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },

  // Fecha cerca de la parte inferior
  dateContainer: {
    position: "absolute",
    bottom: 70, // mueve este valor para bajarla/subirla
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dateLabel: {
    color: "#ffffff",
    fontSize: 14,
  },
  dateValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
