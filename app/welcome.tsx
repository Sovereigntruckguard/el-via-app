// app/welcome.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Linking,
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

const WHATSAPP_NUMBER = "573147903517";

export default function Welcome() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fade]);

  const openWhatsApp = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20ELVIA%2C%20necesito%20ayuda.`;
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.wrap}>
        {/* Fondo base */}
        <LinearGradient
          colors={["#0E0E0E", "#141414", "#0E0E0E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.bg}
        />
        {/* Shimmer */}
        <Animated.View style={[S.bgOverlay, { opacity: fade }]}>
          <LinearGradient
            colors={[
              "rgba(230,183,200,0.06)",
              "rgba(215,154,179,0.08)",
              "rgba(230,183,200,0.06)",
            ]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={S.bg}
          />
        </Animated.View>

        <ScrollView
          style={S.container}
          contentContainerStyle={S.body}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={S.hero}>
            <Image
              source={require("../assets/elvia-logo.png")}
              style={S.logo}
              resizeMode="contain"
            />
            <Text style={S.kicker}>ELVIA • DOT Express</Text>
            <Text style={S.title}>Bienvenida y Orientación</Text>
            <Text style={S.lead}>
              Estás en el lugar correcto. En 7 días y 20 minutos al día,
              dominarás el inglés operativo y los pasos reales de una inspección
              DOT. Conduce con seguridad, evita multas y protege tu trabajo.
            </Text>
          </View>

          <Section title="¿Cómo funciona? (3 pasos)">
            <Bullet>1. Abre un módulo al día (20 minutos).</Bullet>
            <Bullet>2. Escucha, repite y responde las simulaciones.</Bullet>
            <Bullet>3. Completa los quizzes y avanza al siguiente módulo.</Bullet>
          </Section>

          <Section title="Lo que recibirás">
            <Bullet>Manual bilingüe con frases de inspección.</Bullet>
            <Bullet>Roleplays y audios listos para práctica.</Bullet>
            <Bullet>Guía visual de señales + mock exam.</Bullet>
            <Bullet>Examen por módulo y certificado final.</Bullet>
          </Section>

          <Section title="Consejos para tu éxito">
            <Bullet>Usa audífonos para enfocarte.</Bullet>
            <Bullet>Repite en voz alta. La voz crea memoria.</Bullet>
            <Bullet>No saltes módulos; sigue el orden de 7 días.</Bullet>
            <Bullet>Practica una frase extra fuera del checklist.</Bullet>
          </Section>

          <View style={[S.card, S.cardGhost]}>
            <Text style={S.cardTitle}>¿Necesitas ayuda en el camino?</Text>
            <Text style={S.cardText}>
              Nuestro equipo te acompaña. Escríbenos por WhatsApp y te guiamos.
            </Text>
            <TouchableOpacity
              style={S.btnOutline}
              onPress={openWhatsApp}
              activeOpacity={0.9}
            >
              <Text style={S.btnOutlineText}>Contactar asesor</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={S.btnPrimary}
            onPress={() => router.push("/manual")}
            activeOpacity={0.88}
          >
            <Text style={S.btnPrimaryText}>Empezar Plan 7 Días</Text>
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

          <View style={{ height: 16 }} />
          <RoseEmbossedSeal />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={[S.card, S.cardSolid]}>
      <Text style={S.cardTitle}>{title}</Text>
      <View style={{ height: 8 }} />
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}
function Bullet({ children }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
      <Text style={{ color: ROSEN.colors.roseDeep, marginTop: 1 }}>•</Text>
      <Text style={{ color: ROSEN.colors.mute, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  wrap: { flex: 1, backgroundColor: ROSEN.colors.black },
  bg: { position: "absolute", inset: 0 },
  bgOverlay: { position: "absolute", inset: 0 },

  container: { flex: 1, backgroundColor: "transparent" },
  body: {
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  hero: { alignItems: "center", marginBottom: 8 },
  logo: { width: 130, height: 64, marginBottom: 8, opacity: 0.98 },
  kicker: {
    alignSelf: "center",
    color: ROSEN.colors.rose,
    backgroundColor: "rgba(230,183,200,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "800",
  },
  title: {
    color: ROSEN.colors.white,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },
  lead: {
    color: ROSEN.colors.mute,
    marginTop: 6,
    lineHeight: 20,
    textAlign: "center",
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 14,
    marginVertical: 6,
  },
  cardSolid: { backgroundColor: ROSEN.colors.card },
  cardGhost: { backgroundColor: "#141414" },
  cardTitle: { color: ROSEN.colors.roseDeep, fontWeight: "900" },
  cardText: { color: ROSEN.colors.mute },

  btnPrimary: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    marginTop: 10,
  },
  btnPrimaryText: {
    color: ROSEN.colors.black,
    textAlign: "center",
    fontWeight: "900",
  },

  btnOutline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnOutlineText: { color: ROSEN.colors.roseDeep, fontWeight: "800" },

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
