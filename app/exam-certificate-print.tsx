// app/exam-certificate-print.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Image,
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
    if (
      Platform.OS === "web" &&
      !loading &&
      result &&
      typeof window !== "undefined"
    ) {
      setTimeout(() => {
        window.print();
      }, 400);
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
      <View style={styles.center}>
        <View style={styles.certificateBox}>
          {/* Imagen base del certificado */}
          <Image
            source={require("../assets/certificates/elvia_certificate_base.png")}
            style={styles.certImage}
            resizeMode="contain"
          />
          {/* Nombre centrado en el espacio del certificado */}
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>
              {fullName || "Nombre del participante"}
            </Text>
          </View>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
  },
  certificateBox: {
    width: "100%",
    maxWidth: 1200,
    aspectRatio: 1248 / 832, // proporción real de tu PNG
    position: "relative",
  },
  certImage: {
    width: "100%",
    height: "100%",
  },
  nameContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    // Ajusta este valor para dejar el nombre justo en el espacio del certificado
    top: "47%",
    alignItems: "center",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
});
