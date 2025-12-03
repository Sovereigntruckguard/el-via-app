// app/manual.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoseEmbossedSeal from "../components/RoseEmbossedSeal";
import { ROSEN } from "../lib/rosen";
import {
  canTakeCertExam,
  loadCourseProgress,
  type ModuleProgressFlags,
} from "../services/progress";

const LOGO = require("../assets/elvia-logo.png");

export default function Manual() {
  const router = useRouter();
  const [courseProgress, setCourseProgress] = useState<ModuleProgressFlags | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const p = await loadCourseProgress();
      setCourseProgress(p);
    })();
  }, []);

  // 🔹 Reglas de desbloqueo
  const canExamM2 = !!courseProgress?.m1_phrases_completed;
  const canExamM3 = !!courseProgress?.m3_signals_completed;
  const canExamFinal =
    courseProgress != null ? canTakeCertExam(courseProgress) : false;

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.container}
        contentContainerStyle={S.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.logoWrap}>
          <Image source={LOGO} style={S.logo} resizeMode="contain" />
        </View>

        <Text style={S.title}>Plan 7 días – ELVIA • DOT Express</Text>
        <Text style={S.desc}>20 minutos diarios. Enfocado en inspección DOT.</Text>

        {/* Módulos de contenido */}
        <TouchableOpacity
          style={S.btnPrimary}
          onPress={() => router.push("/training")}
          activeOpacity={0.9}
        >
          <Text style={S.btnPrimaryText}>Frases con inspector</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.btnOutline}
          onPress={() => router.push("/glossary")}
          activeOpacity={0.9}
        >
          <Text style={S.btnOutlineText}>Señales de tránsito</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.btnOutline}
          onPress={() => router.push("/roleplays")}
          activeOpacity={0.9}
        >
          <Text style={S.btnOutlineText}>Roleplays (30)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.btnOutline}
          onPress={() => router.push("/pronunciation")}
          activeOpacity={0.9}
        >
          <Text style={S.btnOutlineText}>Pronunciación</Text>
        </TouchableOpacity>

        {/* Exámenes */}
        <TouchableOpacity
          style={[S.btnInfo, !canExamM2 && S.btnInfoDisabled]}
          disabled={!canExamM2}
          onPress={() => router.push("/exam-m2")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              !canExamM2 && S.btnInfoTextDisabled,
            ]}
          >
            Examen frases con inspector
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.btnInfo, !canExamM3 && S.btnInfoDisabled]}
          disabled={!canExamM3}
          onPress={() => router.push("/exam-m3")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              !canExamM3 && S.btnInfoTextDisabled,
            ]}
          >
            Examen señales de tránsito
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.btnInfo, !canExamFinal && S.btnInfoDisabled]}
          disabled={!canExamFinal}
          onPress={() => router.push("/exam-final")}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              !canExamFinal && S.btnInfoTextDisabled,
            ]}
          >
            Examen certificable
          </Text>
        </TouchableOpacity>

        {/* Navegación inferior */}
        <View style={{ height: 16 }} />
        <View style={S.navRow}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <Text style={S.backBtnText}>⬅ Atrás</Text>
          </Pressable>
          <TouchableOpacity
            style={S.homeBtn}
            onPress={() => router.push("/home")}
            activeOpacity={0.9}
          >
            <Text style={S.homeBtnText}>🏠 Volver al inicio</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 18 }} />
        <RoseEmbossedSeal />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  body: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  logoWrap: { alignItems: "center", marginBottom: 4 },
  logo: { width: 120, height: 60, opacity: 0.98 },

  title: { color: ROSEN.colors.white, fontSize: 20, fontWeight: "800" },
  desc: { color: ROSEN.colors.mute, marginBottom: 12 },

  btnPrimary: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
  },
  btnPrimaryText: {
    color: ROSEN.colors.black,
    textAlign: "center",
    fontWeight: "900",
  },

  btnOutline: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
  },
  btnOutlineText: {
    color: ROSEN.colors.roseDeep,
    textAlign: "center",
    fontWeight: "800",
  },

  btnInfo: {
    backgroundColor: "#0a84ff",
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  btnInfoDisabled: {
    backgroundColor: "#111827",
    borderColor: "rgba(148,163,184,0.6)",
  },
  btnInfoText: {
    color: "#0B0B0B",
    textAlign: "center",
    fontWeight: "800",
  },
  btnInfoTextDisabled: {
    color: "#9CA3AF",
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignItems: "center",
  },
  backBtnText: {
    color: ROSEN.colors.rose,
    fontWeight: "800",
  },
  homeBtn: {
    flex: 1,
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    alignItems: "center",
  },
  homeBtnText: { color: ROSEN.colors.black, fontWeight: "900" },
});
