// app/manual.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";
import {
  canTakeCertExam,
  loadCourseProgress,
  type ModuleProgressFlags,
} from "../services/progress";

const LOGO = require("../assets/elvia-logo.png");

export default function Manual() {
  const router = useRouter();
  const { isPaid } = useAuth();
  const [courseProgress, setCourseProgress] = useState<ModuleProgressFlags | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const p = await loadCourseProgress();
      setCourseProgress(p);
    })();
  }, []);

  // 🔹 Reglas de desbloqueo por progreso
  const canExamM2 = !!courseProgress?.m1_phrases_completed;
  const canExamM3 = !!courseProgress?.m3_signals_completed;
  const canExamFinal =
    courseProgress != null ? canTakeCertExam(courseProgress) : false;

  // 🔹 Helpers para PRO
  const goToCheckout = () => {
    router.push("/checkout" as never);
  };

  const requireProAlert = () => {
    Alert.alert(
      "Disponible en EL-VÍA PRO",
      "Para acceder a este módulo necesitas activar EL-VÍA PRO. Es un pago único desde Google Play (~USD 19.99)."
    );
  };

  const handleRoleplaysPress = () => {
    if (!isPaid) {
      requireProAlert();
      goToCheckout();
      return;
    }
    router.push("/roleplays" as never);
  };

  const handlePronunciationPress = () => {
    if (!isPaid) {
      requireProAlert();
      goToCheckout();
      return;
    }
    router.push("/pronunciation" as never);
  };

  const handleExamM3Press = () => {
    if (!isPaid) {
      requireProAlert();
      goToCheckout();
      return;
    }
    if (!canExamM3) {
      Alert.alert(
        "Aún no desbloqueado",
        "Primero completa el contenido de señales de tránsito para habilitar este examen."
      );
      return;
    }
    router.push("/exam-m3" as never);
  };

  const handleExamFinalPress = () => {
    if (!isPaid) {
      requireProAlert();
      goToCheckout();
      return;
    }
    if (!canExamFinal) {
      Alert.alert(
        "Aún no desbloqueado",
        "Debes completar los módulos previos y exámenes para habilitar el examen certificable."
      );
      return;
    }
    router.push("/exam-final" as never);
  };

  const handleExamM2Press = () => {
    if (!canExamM2) {
      Alert.alert(
        "Aún no desbloqueado",
        "Primero completa las frases con el inspector para habilitar este examen."
      );
      return;
    }
    router.push("/exam-m2" as never);
  };

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

        {isPaid ? (
          <View style={S.badgePro}>
            <Text style={S.badgeProText}>✔ Tienes EL-VÍA PRO activo</Text>
          </View>
        ) : (
          <View style={S.badgeFree}>
            <Text style={S.badgeFreeText}>
              Estás en modo gratuito. Puedes desbloquear todo con EL-VÍA PRO.
            </Text>
          </View>
        )}

        {/* Módulos de contenido (FREE) */}
        <TouchableOpacity
          style={S.btnPrimary}
          onPress={() => router.push("/training" as never)}
          activeOpacity={0.9}
        >
          <Text style={S.btnPrimaryText}>Frases con inspector (FREE)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.btnOutline}
          onPress={() => router.push("/glossary" as never)}
          activeOpacity={0.9}
        >
          <Text style={S.btnOutlineText}>Señales de tránsito (FREE)</Text>
        </TouchableOpacity>

        {/* PRO – Roleplays y Pronunciación */}
        <TouchableOpacity
          style={[S.btnOutline, !isPaid && S.btnProLocked]}
          onPress={handleRoleplaysPress}
          activeOpacity={0.9}
        >
          <Text style={[S.btnOutlineText, !isPaid && S.btnProLockedText]}>
            Roleplays (30) {isPaid ? "(PRO)" : "— Requiere PRO"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.btnOutline, !isPaid && S.btnProLocked]}
          onPress={handlePronunciationPress}
          activeOpacity={0.9}
        >
          <Text style={[S.btnOutlineText, !isPaid && S.btnProLockedText]}>
            Pronunciación {isPaid ? "(PRO)" : "— Requiere PRO"}
          </Text>
        </TouchableOpacity>

        {/* Exámenes */}
        <TouchableOpacity
          style={[S.btnInfo, !canExamM2 && S.btnInfoDisabled]}
          disabled={!canExamM2}
          onPress={handleExamM2Press}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              !canExamM2 && S.btnInfoTextDisabled,
            ]}
          >
            Examen frases con inspector (FREE)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            S.btnInfo,
            (!isPaid || !canExamM3) && S.btnInfoDisabled,
          ]}
          disabled={!isPaid || !canExamM3}
          onPress={handleExamM3Press}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              (!isPaid || !canExamM3) && S.btnInfoTextDisabled,
            ]}
          >
            Examen señales de tránsito {isPaid ? "" : "— Requiere PRO"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            S.btnInfo,
            (!isPaid || !canExamFinal) && S.btnInfoDisabled,
          ]}
          disabled={!isPaid || !canExamFinal}
          onPress={handleExamFinalPress}
          activeOpacity={0.9}
        >
          <Text
            style={[
              S.btnInfoText,
              (!isPaid || !canExamFinal) && S.btnInfoTextDisabled,
            ]}
          >
            Examen certificable {isPaid ? "" : "— Requiere PRO"}
          </Text>
        </TouchableOpacity>

        {/* CTA PRO si está en modo FREE */}
        {!isPaid && (
          <TouchableOpacity
            style={S.btnProCta}
            onPress={goToCheckout}
            activeOpacity={0.9}
          >
            <Text style={S.btnProCtaText}>Desbloquear EL-VÍA PRO</Text>
          </TouchableOpacity>
        )}

        {/* Navegación inferior */}
        <View style={{ height: 16 }} />
        <View style={S.navRow}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <Text style={S.backBtnText}>⬅ Atrás</Text>
          </Pressable>
          <TouchableOpacity
            style={S.homeBtn}
            onPress={() => router.push("/home" as never)}
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

  badgePro: {
    backgroundColor: "rgba(16,185,129,0.2)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.6)",
    marginBottom: 12,
  },
  badgeProText: {
    color: "#6EE7B7",
    fontWeight: "800",
  },
  badgeFree: {
    backgroundColor: "rgba(234,179,8,0.12)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(234,179,8,0.5)",
    marginBottom: 12,
  },
  badgeFreeText: {
    color: "#FBBF24",
    fontWeight: "700",
  },

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

  btnProLocked: {
    opacity: 0.8,
  },
  btnProLockedText: {
    color: "#9CA3AF",
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

  btnProCta: {
    marginTop: 10,
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
  },
  btnProCtaText: {
    color: ROSEN.colors.black,
    textAlign: "center",
    fontWeight: "900",
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
