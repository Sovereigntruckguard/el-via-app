// app/home.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RoseEmbossedSeal from "../components/RoseEmbossedSeal";
import {
  loadCourseProgress,
  type ModuleProgressFlags,
} from "../services/progress";

const LOGO = require("../assets/elvia-logo.png");
const STORAGE_NAME = "elvia:user:name";

export default function Home() {
  const [name, setName] = useState<string>("");
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    (async () => {
      // Nombre del usuario
      const stored = await AsyncStorage.getItem(STORAGE_NAME);
      if (stored) setName(stored);

      // Progreso global basado en flags de módulos + exámenes
      try {
        const p: ModuleProgressFlags = await loadCourseProgress();

        const items = [
          p.m1_phrases_completed,
          p.m2_pronunciation_completed,
          p.m3_signals_completed,
          p.m4_roleplays_completed,
          p.exam_phrases_passed,
          p.exam_signals_passed,
          p.exam_cert_passed,
        ];

        const done = items.filter(Boolean).length;
        const total = items.length;

        const pct = total
          ? Math.min(100, Math.round((done / total) * 100))
          : 0;
        setProgressPct(pct);
      } catch (err) {
        console.error("[HOME] Error calculando progreso global:", err);
        setProgressPct(0);
      }
    })();
  }, []);

  const medals = useMemo(
    () => [
      { id: "br", icon: "🥉", name: "Novato en carretera", threshold: 10 },
      { id: "si", icon: "🏅", name: "Piloto constante", threshold: 25 },
      { id: "go", icon: "🥈", name: "Conductor seguro", threshold: 50 },
      { id: "pl", icon: "🥇", name: "Dominio en pista", threshold: 75 },
      { id: "mx", icon: "🏆", name: "Maestro del DOT", threshold: 100 },
    ],
    []
  );

  return (
    <View style={S.container}>
      <ScrollView
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + título */}
        <Image source={LOGO} style={S.logo} resizeMode="contain" />
        <Text style={S.brand}>EL-VIA DOT Express</Text>
        <Text style={S.welcome}>Bienvenido {name}</Text>

        {/* Botones principales (centrados) */}
        <View style={S.buttons}>
          <Link href="/welcome" style={[S.btn, S.btnPrimary]}>
            <Text style={S.btnTextPrimary}>Bienvenida y orientación</Text>
          </Link>
          <Link href="/manual" style={[S.btn, S.btnOutline]}>
            <Text style={S.btnTextOutline}>Manual bilingüe</Text>
          </Link>
        </View>

        {/* Enlace al Manual de uso de la app */}
        <View style={S.userManualRow}>
          <Link href={"/manual-user" as any}>
            <Text style={S.userManualLink}>Ver manual de uso de la app</Text>
          </Link>
        </View>

        {/* Progreso total */}
        <View style={S.progressBox}>
          <Text style={S.progressTitle}>Progreso total</Text>
          <View style={S.progressWrap}>
            <View style={[S.progressBar, { width: `${progressPct}%` }]} />
          </View>
          <Text style={S.progressPercent}>{progressPct}%</Text>
        </View>

        {/* Mensaje */}
        <Text style={S.inspiration}>
          “Cada kilómetro que recorres también te acerca a dominar el inglés del
          camino.”
        </Text>

        {/* Stand de medallas con animación */}
        <View style={S.medalStand}>
          {medals.map((m) => (
            <MedalSlot
              key={m.id}
              icon={m.icon}
              title={m.name}
              threshold={m.threshold}
              unlocked={progressPct >= m.threshold}
            />
          ))}
        </View>

        {/* Objetivo */}
        <View style={S.goalBox}>
          <Text style={S.goalTitle}>Objetivo del programa</Text>
          <Text style={S.goalText}>
            En solo 7 días dominarás las frases clave para inspecciones DOT,
            responderás con confianza y reducirás errores a menos del 15%.
          </Text>
        </View>

        {/* Footer legal interno */}
        <View style={S.legalRow}>
          <Link href={"/privacy" as any}>
            <Text style={S.legalLink}>Privacidad</Text>
          </Link>
          <Link href={"/terms" as any}>
            <Text style={S.legalLink}>Términos</Text>
          </Link>
          <Link href={"/refunds" as any}>
            <Text style={S.legalLink}>Reembolsos</Text>
          </Link>
        </View>

        {/* Sello al final del scroll */}
        <RoseEmbossedSeal />
      </ScrollView>
    </View>
  );
}

/** Componente de medalla con animación de brillo/pulso cuando está desbloqueada */
function MedalSlot({
  icon,
  title,
  threshold,
  unlocked,
}: {
  icon: string;
  title: string;
  threshold: number;
  unlocked: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!unlocked) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [unlocked]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View
      style={[
        S.medalSlot,
        unlocked && {
          transform: [{ scale }],
          shadowColor: "#FFD700",
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
        },
      ]}
    >
      {unlocked && <Animated.View style={[S.sheen, { opacity: glow }]} />}
      <Text style={[S.medalIcon, !unlocked && S.locked]}>{icon}</Text>
      <Text style={[S.medalName, !unlocked && S.locked]}>{title}</Text>
      <Text style={[S.medalThresh, !unlocked && S.locked]}>
        {threshold}%+
      </Text>
    </Animated.View>
  );
}

const WHITE_GOLD = "#EAE6D7";
const CARD = "#1E1E1E";

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  logo: { width: 240, height: 120, marginBottom: 6, opacity: 0.98 },
  brand: {
    color: "#E6B7C8",
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  welcome: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 14,
    textAlign: "center",
  },

  // Botones (texto centrado)
  buttons: { marginTop: 2, width: "100%", alignItems: "center" },
  btn: {
    width: "82%",
    paddingVertical: 14,
    borderRadius: 14,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    display: "flex", // fuerza centrado en web (Link)
  },
  btnPrimary: { backgroundColor: "#E6B7C8", borderColor: "#D79AB3" },
  btnOutline: { backgroundColor: CARD, borderColor: "#D79AB3" },
  btnTextPrimary: {
    color: "#181818",
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center", // Android
    width: "100%",
  },
  btnTextOutline: {
    color: "#D79AB3",
    fontWeight: "800",
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },

  // Link manual usuario
  userManualRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  userManualLink: {
    color: "#E6B7C8",
    fontSize: 13,
    textDecorationLine: "underline",
  },

  // Progreso oro blanco
  progressBox: { marginTop: 18, width: "86%", alignItems: "center" },
  progressTitle: { color: "#E6B7C8", fontWeight: "900", marginBottom: 6 },
  progressWrap: {
    width: "100%",
    height: 16,
    backgroundColor: CARD,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  progressBar: { height: "100%", backgroundColor: WHITE_GOLD },
  progressPercent: { color: "#FFFFFF", fontSize: 12, marginTop: 4 },

  inspiration: {
    color: "#E6B7C8",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 14,
    paddingHorizontal: 18,
  },

  // Medallero / stand
  medalStand: {
    width: "100%",
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 12,
  },
  medalSlot: {
    width: 130,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    paddingVertical: 12,
    overflow: "hidden",
    position: "relative",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: -40,
    width: 80,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: [{ rotate: "25deg" }],
  },
  medalIcon: { fontSize: 34, marginBottom: 4 },
  medalName: { color: "#FFD700", fontWeight: "800", textAlign: "center" },
  medalThresh: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  locked: { opacity: 0.45 },

  // Objetivo
  goalBox: {
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
    width: "92%",
  },
  goalTitle: {
    color: "#E6B7C8",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
    textAlign: "center",
  },
  goalText: { color: "#9CA3AF", textAlign: "center", lineHeight: 20 },

  // Footer legal interno
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  legalLink: {
    color: "#9CA3AF",
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
