// app/exam-certificate-print.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

type ExamResult = {
  fullName?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

const STORAGE_KEY = "elvia_exam_final_result";

export default function ExamCertificatePrintScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ExamResult;
          setResult(parsed);
          const authName =
            user?.name && user.name.trim().length > 0 ? user.name.trim() : "";
          setFullName(authName || parsed.fullName || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (Platform.OS === "web" && !loading && result && typeof window !== "undefined") {
      // damos un pequeño delay para asegurar que se renderice
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [loading, result]);

  if (loading || !result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Preparando certificado…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* SOLO el certificado ocupa la pantalla */}
      <View style={styles.fullWrapper}>
        <ImageBackground
          source={require("../assets/certificates/elvia_certificate_base.png")}
          style={styles.previewImage}
        >
          <View style={styles.overlay}>
            <Text style={styles.nameText}>
              {fullName || "Nombre del participante"}
            </Text>
            <Text style={styles.scoreText}>
              Puntaje: {result.score.toFixed(1)}% · {result.correctAnswers}/
              {result.totalQuestions} correctas
            </Text>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff" },

  fullWrapper: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    // Se imprime toda la imagen; márgenes los maneja el diálogo de impresión
  },
  overlay: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    position: "absolute",
    // Ajusta estos valores para posicionar el nombre EXACTO en la plantilla
    top: "46%", // aproximado, mueve si hace falta
    alignSelf: "center",
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  scoreText: {
    position: "absolute",
    top: "52%", // debajo del nombre
    alignSelf: "center",
    color: "#ffffff",
    fontSize: 14,
  },
});
