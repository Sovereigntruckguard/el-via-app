// app/index.tsx
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";

export default function Onboarding() {
  const router = useRouter();
  const { isPaid } = useAuth();

  React.useEffect(() => {
    if (isPaid) {
      const t = setTimeout(() => router.push("/sign-in"), 800);
      return () => clearTimeout(t);
    }
  }, [isPaid]);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.container}
        contentContainerStyle={S.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.heroWrap}>
          <Image
            source={require("../assets/elvia-logo.png")}
            style={S.logoHero}
            resizeMode="contain"
          />
          <Text style={S.kicker}>ELVIA • DOT Express</Text>
          <Text style={S.title}>Aprende lo que realmente te revisan</Text>
          <Text style={S.lead}>
            En 7 días y con 20 minutos al día, domina el inglés operativo y los
            pasos de la inspección DOT. Responde con seguridad, evita multas y
            protege tu trabajo.
          </Text>
          {isPaid && (
            <View style={S.badgePaid}>
              <Text style={S.badgePaidText}>
                ✔ Acceso activo – gracias por confiar
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
        <View style={S.card}>
          <Text style={S.cardTitle}>¿Qué problema resolvemos?</Text>
          <Text style={S.cardText}>
            • Barrera de idioma en carretera • Estrés e incertidumbre
          </Text>
          <Text style={S.cardText}>
            • Multas por fallas en documentos y señales
          </Text>
        </View>

        <View style={{ height: 10 }} />
        <View style={S.card}>
          <Text style={S.cardTitle}>¿Por qué es una gran inversión?</Text>
          <Text style={S.cardText}>
            • Ahorro por evitar incidentes y multas.
          </Text>
          <Text style={S.cardText}>
            • Mejora tu empleabilidad y desempeño.
          </Text>
          <Text style={S.cardText}>
            • Acceso permanente a contenido bilingüe y simulaciones.
          </Text>
        </View>

        <View style={{ height: 18 }} />
        {!isPaid && (
          <TouchableOpacity
            style={S.btnBuy}
            onPress={() => router.push("/checkout")}
            activeOpacity={0.9}
          >
            <Text style={S.btnBuyText}>Comprar acceso</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[S.btnAccess, isPaid && { marginTop: 0 }]}
          onPress={() => router.push("/sign-in")}
          activeOpacity={0.9}
        >
          <Text style={S.btnAccessText}>Ya tengo acceso</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ROSEN.colors.black, // ocupa también la zona de la barra de estado
  },
  container: {
    flex: 1,
    backgroundColor: ROSEN.colors.black,
  },
  body: {
    paddingTop: 16, // empuja todo hacia abajo para que el logo no se tape
    paddingBottom: 28,
  },
  heroWrap: {
    alignItems: "center",
    paddingHorizontal: 18,
  },
  logoHero: { width: 160, height: 80, marginBottom: 8, opacity: 0.98 },
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
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  badgePaid: {
    marginTop: 10,
    backgroundColor: "rgba(230,183,200,0.16)",
    borderColor: ROSEN.colors.roseDeep,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgePaidText: { color: ROSEN.colors.rose, fontWeight: "800" },
  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 14,
    marginHorizontal: 18,
    marginVertical: 6,
  },
  cardTitle: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardText: { color: ROSEN.colors.mute, lineHeight: 20 },
  btnBuy: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    marginHorizontal: 18,
  },
  btnBuyText: {
    color: ROSEN.colors.black,
    textAlign: "center",
    fontWeight: "900",
  },
  btnAccess: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 18,
  },
  btnAccessText: {
    color: ROSEN.colors.roseDeep,
    textAlign: "center",
    fontWeight: "800",
  },
});
