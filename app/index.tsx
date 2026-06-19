// app/index.tsx
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";

// HERO y logo
const HERO = require("../assets/hero-trucker.png");
const LOGO = require("../assets/elvia-logo.png");

// VIDEO TEASER (ruta real donde lo tienes)
const TEASER_1 = require("../assets/videos/elvia-teaser-1.mp4");

// Iconos
const ICON_LESSISSUES = require("../assets/icons/elvia-lessissues.png");
const ICON_CONFIDENCE = require("../assets/icons/elvia-confidence.png");
const ICON_BETTERLOADS = require("../assets/icons/elvia-betterloads.png");
const ICON_CERTIFICATE = require("../assets/icons/elvia-certificate.png");
const ICON_PLAN7 = require("../assets/icons/elvia-plan7.png");
const ICON_PROGRESS = require("../assets/icons/elvia-progress.png");

export default function Onboarding() {
  const router = useRouter();
  const { isPaid } = useAuth();

  React.useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => router.push("/sign-in"), 800);
      return () => clearTimeout(t);
    }
  }, [isPaid, router]);

  const goSignUp = () => router.push("/sign-up" as never);
  const goSignIn = () => router.push("/sign-in" as never);
  const goCheckout = () => router.push("/checkout" as never);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.container}
        contentContainerStyle={S.body}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={S.heroWrapper}>
          <ImageBackground
            source={HERO}
            style={S.heroBackground}
            imageStyle={S.heroImage}
          >
            <View style={S.heroOverlay} />
            <View style={S.heroContent}>
              <Image source={LOGO} style={S.logoHero} resizeMode="contain" />
              <View style={S.heroTopRow}>
                <Text style={S.kicker}>ELVIA • DOT Express</Text>
                <View style={S.aiBadge}>
                </View>
              </View>
              <Text style={S.heroTitle}>
                Domina las inspecciones DOT con IA en 7 días.
              </Text>
              <Text style={S.heroLead}>
                Simulaciones con IA de frases reales, señales y controles en
                carretera. Menos miedo, menos multas, más contratos.
              </Text>
              <Text style={S.heroSub}>
                Hecho por latinos, para latinos que se parten el alma en la
                carretera.
              </Text>
              {isPaid && (
                <View style={S.badgePaid}>
                  <Text style={S.badgePaidText}>
                    ✔ Tienes EL-VÍA PRO activo. Entra a tu cuenta.
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* VIDEO TEASER IA */}
        <View style={S.videoContainer}>
          <Video
            source={TEASER_1}
            style={S.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            isMuted={false}
            useNativeControls
          />
        </View>

        {/* BLOQUE DE VALOR */}
        <View style={S.card}>
          <View style={S.cardHeaderRow}>
            <Text style={S.cardTitle}>¿Qué vas a entrenar aquí?</Text>
            <View style={S.iconCircle}>
              <Image
                source={ICON_CERTIFICATE}
                style={S.iconSmall}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={S.cardText}>
            • Frases EXACTAS que puede usar un oficial en una inspección DOT.
          </Text>
          <Text style={S.cardText}>
            • Señales de tránsito clave que más generan problemas.
          </Text>
          <Text style={S.cardText}>
            • Roleplays con IA para practicar situaciones reales con oficiales y
            despachadores.
          </Text>
          <Text style={S.cardText}>
            • Pronunciación funcional para carretera, entrenada por IA.
          </Text>
          <Text style={[S.cardText, { marginTop: 6 }]}>
            • Exámenes por módulo y certificado final con tu nombre.
          </Text>
        </View>

        {/* MODO GRATUITO */}
        <View style={S.cardAlt}>
          <View style={S.cardHeaderRow}>
            <Text style={S.cardTitleAlt}>Modo gratuito incluye:</Text>
            <View style={S.iconRowCompact}>
              <Image
                source={ICON_PLAN7}
                style={S.iconTiny}
                resizeMode="contain"
              />
              <Image
                source={ICON_PROGRESS}
                style={S.iconTiny}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={S.cardTextAlt}>
            • Acceso al plan de 7 días con IA.
          </Text>
          <Text style={S.cardTextAlt}>
            • Frases con inspector, señales y primer examen entrenados con IA.
          </Text>
          <Text style={S.cardTextAlt}>
            • Tu cuenta personal para guardar progreso y seguir donde quedaste.
          </Text>
          <Text style={[S.cardTextAlt, { marginTop: 6 }]}>
            Puedes activar EL-VÍA PRO cuando quieras desde dentro de la app.
          </Text>
        </View>

        {/* CTAS */}
        <View style={{ height: 18 }} />
        {!isPaid ? (
          <>
            <TouchableOpacity
              style={S.btnPrimary}
              onPress={goSignUp}
              activeOpacity={0.9}
            >
              <Text style={S.btnPrimaryText}>Crear cuenta gratuita</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={S.btnSecondary}
              onPress={goSignIn}
              activeOpacity={0.9}
            >
              <Text style={S.btnSecondaryText}>
                Ya tengo cuenta, ingresar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={S.btnGhost}
              onPress={goCheckout}
              activeOpacity={0.9}
            >
              <Text style={S.btnGhostText}>
                Desbloquear EL-VÍA PRO • Pago único ~USD 19.99
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={S.btnPrimary}
            onPress={goSignIn}
            activeOpacity={0.9}
          >
            <Text style={S.btnPrimaryText}>Entrar a mi entrenamiento</Text>
          </TouchableOpacity>
        )}

        {/* PRUEBA SOCIAL CON ICONOS */}
        <View style={S.socialCard}>
          <Text style={S.socialTitle}>
            +17,000 camioneros latinos ya entrenan con IA en EL-VÍA
          </Text>
          <View style={S.socialBadgesRow}>
            <View style={S.socialBadge}>
              <Image
                source={ICON_LESSISSUES}
                style={S.iconSocial}
                resizeMode="contain"
              />
              <Text style={S.socialBadgeText}>Menos multas</Text>
            </View>
            <View style={S.socialBadge}>
              <Image
                source={ICON_CONFIDENCE}
                style={S.iconSocial}
                resizeMode="contain"
              />
              <Text style={S.socialBadgeText}>Más confianza</Text>
            </View>
            <View style={S.socialBadge}>
              <Image
                source={ICON_BETTERLOADS}
                style={S.iconSocial}
                resizeMode="contain"
              />
              <Text style={S.socialBadgeText}>Mejores cargas</Text>
            </View>
          </View>
        </View>

        {/* SELLO AUTORIDAD */}
        <View style={S.authorityRow}>
          <Text style={S.authorityText}>
            Entrenamiento diseñado con conductores latinos, situaciones DOT
            reales y tecnología SOLYON IA.
          </Text>
        </View>

        {/* FOOTER LEGAL */}
        <View style={S.legalRow}>
          <Pressable onPress={() => router.push("/privacy" as never)}>
            <Text style={S.legalLink}>Privacidad</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/terms" as never)}>
            <Text style={S.legalLink}>Términos</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/refunds" as never)}>
            <Text style={S.legalLink}>Reembolsos</Text>
          </Pressable>
        </View>
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
    paddingBottom: 28,
  },

  heroWrapper: {
    marginBottom: 16,
  },
  heroBackground: {
    width: "100%",
    height: 260,
    justifyContent: "flex-end",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  logoHero: { width: 140, height: 60, marginBottom: 6, opacity: 0.98 },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  kicker: {
    alignSelf: "flex-start",
    color: ROSEN.colors.rose,
    backgroundColor: "rgba(230,183,200,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "800",
  },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.5)",
  },
  aiBadgeText: {
    color: "#E5E7EB",
    fontSize: 10,
    fontWeight: "700",
  },

  heroTitle: {
    color: ROSEN.colors.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  heroLead: {
    color: ROSEN.colors.mute,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  heroSub: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },

  badgePaid: {
    marginTop: 8,
    backgroundColor: "rgba(16,185,129,0.3)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  badgePaidText: {
    color: "#BBF7D0",
    fontWeight: "800",
    fontSize: 12,
  },

  videoContainer: {
    width: "100%",
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 14,
    marginHorizontal: 18,
    marginVertical: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "900",
    fontSize: 15,
  },
  cardText: { color: ROSEN.colors.mute, lineHeight: 20 },

  cardAlt: {
    backgroundColor: "#050816",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.6)",
    padding: 14,
    marginHorizontal: 18,
    marginVertical: 6,
  },
  cardTitleAlt: {
    color: "#FACC15",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 4,
  },
  cardTextAlt: { color: "#E5E7EB", lineHeight: 20 },

  btnPrimary: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    marginHorizontal: 18,
  },
  btnPrimaryText: {
    color: ROSEN.colors.black,
    textAlign: "center",
    fontWeight: "900",
  },
  btnSecondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 18,
  },
  btnSecondaryText: {
    color: ROSEN.colors.roseDeep,
    textAlign: "center",
    fontWeight: "800",
  },
  btnGhost: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 10,
    marginHorizontal: 18,
  },
  btnGhostText: {
    color: ROSEN.colors.mute,
    textAlign: "center",
    fontSize: 12,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSmall: {
    width: 26,
    height: 26,
  },
  iconRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconTiny: {
    width: 22,
    height: 22,
  },

  socialCard: {
    marginTop: 20,
    marginHorizontal: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    backgroundColor: "#020617",
  },
  socialTitle: {
    color: "#E5E7EB",
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 13,
  },
  socialBadgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  socialBadge: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    alignItems: "center",
    gap: 4,
  },
  iconSocial: {
    width: 26,
    height: 26,
  },
  socialBadgeText: {
    color: "#E5E7EB",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "700",
  },

  authorityRow: {
    marginTop: 16,
    marginHorizontal: 18,
  },
  authorityText: {
    color: ROSEN.colors.mute,
    fontSize: 11,
    textAlign: "center",
  },

  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 28,
    marginBottom: 18,
  },
  legalLink: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
