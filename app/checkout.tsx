// app/checkout.tsx
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROSEN } from "../lib/rosen";

const STRIPE_ELVIA_URL =
  "https://buy.stripe.com/9B63cxd6Feb76oD88V9Zm00";

const LOGO = require("../assets/elvia-logo.png");

export default function Checkout() {
  const router = useRouter();

  const handleStripePay = async () => {
    try {
      const canOpen = await Linking.canOpenURL(STRIPE_ELVIA_URL);
      if (!canOpen) {
        console.error("[CHECKOUT] No se puede abrir el navegador para Stripe.");
        return;
      }
      await Linking.openURL(STRIPE_ELVIA_URL);
      // Versión 1.0:
      // El usuario paga en Stripe, vuelve manualmente a la app
      // y luego usa "Ya pagué, crear mi acceso".
    } catch (err) {
      console.error("[CHECKOUT] Error abriendo Stripe:", err);
    }
  };

  const handleCreateAccess = () => {
    // Lo llevamos al formulario de registro
    router.push("/sign-up" as never);
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        <View style={S.header}>
          <Image source={LOGO} style={S.logo} resizeMode="contain" />
          <Text style={S.kicker}>ELVIA • DOT Express</Text>
        </View>

        <View style={S.card}>
          <Text style={S.title}>Acceso al programa completo</Text>
          <Text style={S.desc}>
            Incluye todos los módulos, audios, roleplays, señales y exámenes
            certificables. Acceso permanente al contenido y a tu certificado.
          </Text>

          <Text style={S.price}>USD 199</Text>
          <Text style={S.subPrice}>
            Pago seguro con Stripe. Puedes pagar en dólares o en tu moneda, tu
            banco hace la conversión.
          </Text>

          {/* Botón 1 – Pagar con Stripe */}
          <TouchableOpacity
            style={S.btnPrimary}
            onPress={handleStripePay}
            activeOpacity={0.9}
          >
            <Text style={S.btnPrimaryText}>Pagar con tarjeta (Stripe)</Text>
          </TouchableOpacity>

          {/* Botón 2 – Ya pagó, crear acceso */}
          <TouchableOpacity
            style={S.btnSecondary}
            onPress={handleCreateAccess}
            activeOpacity={0.9}
          >
            <Text style={S.btnSecondaryText}>
              Ya pagué en Stripe, crear mi acceso
            </Text>
          </TouchableOpacity>

          <Text style={S.note}>
            1) Primero realiza el pago en Stripe.{"\n"}
            2) Luego vuelve a ELVIA y toca “Ya pagué en Stripe, crear mi
            acceso” para registrar tu correo, contraseña y nombre COMPLETO.{"\n"}
            Ese nombre será el que aparecerá en tu certificado oficial.
          </Text>
        </View>
      </View>
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
    padding: 16,
  },
  header: { alignItems: "center", marginTop: 14, marginBottom: 8 },
  logo: { width: 130, height: 64, opacity: 0.98 },
  kicker: {
    alignSelf: "center",
    color: ROSEN.colors.rose,
    backgroundColor: "rgba(230,183,200,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "800",
    marginTop: 6,
  },
  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 18,
    marginTop: 10,
  },
  title: { color: ROSEN.colors.white, fontSize: 20, fontWeight: "900" },
  desc: { color: ROSEN.colors.mute, marginTop: 8, lineHeight: 20 },
  price: {
    color: ROSEN.colors.rose,
    fontWeight: "900",
    fontSize: 22,
    marginTop: 12,
  },
  subPrice: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
    marginBottom: 10,
  },
  btnPrimaryText: {
    textAlign: "center",
    color: ROSEN.colors.black,
    fontWeight: "900",
  },
  btnSecondary: {
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 10,
  },
  btnSecondaryText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "800",
  },
  note: {
    color: ROSEN.colors.mute,
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
  },
});
