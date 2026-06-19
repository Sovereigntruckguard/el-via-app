// app/checkout.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";
import { purchasePro } from "../services/purchases";

const LOGO = require("../assets/elvia-logo.png");

export default function Checkout() {
  const router = useRouter();
  const { refreshProStatus, setPaid } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handlePurchasePro = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const { success, cancelled } = await purchasePro();

      if (success) {
        await refreshProStatus();
        await setPaid(true);
        Alert.alert(
          "Acceso activado",
          "Has desbloqueado EL-VÍA PRO. Ya puedes acceder a todos los módulos y exámenes."
        );
        // Llevar al usuario al inicio
        router.push("/home" as never);
        return;
      }

      if (cancelled) {
        Alert.alert(
          "Compra cancelada",
          "No se completó el pago. Puedes intentarlo de nuevo cuando quieras."
        );
        return;
      }

      Alert.alert(
        "Error en la compra",
        "Ocurrió un problema al procesar el pago. Intenta de nuevo o contacta soporte."
      );
    } catch (err) {
      console.warn("[CHECKOUT] Error en purchasePro:", err);
      Alert.alert(
        "Error inesperado",
        "No pudimos completar el proceso. Verifica tu conexión e inténtalo de nuevo."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToSignUp = () => {
    // Para usuarios que ya pagaron o quieren crear su usuario después de la compra
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
          <Text style={S.title}>Desbloquea EL-VÍA PRO</Text>
          <Text style={S.desc}>
            Acceso total a todos los módulos, audios, roleplays, señales y
            exámenes certificables. Incluye tu certificado final listo para
            imprimir.
          </Text>

          <Text style={S.price}>USD 19.99</Text>
          <Text style={S.subPrice}>
            Pago único desde Google Play. Sin suscripciones, sin cobros
            mensuales. Pagas una vez y el acceso es tuyo para siempre.
          </Text>

          {/* Botón 1 – Comprar EL-VÍA PRO */}
          <TouchableOpacity
            style={[S.btnPrimary, processing && S.btnDisabled]}
            onPress={handlePurchasePro}
            activeOpacity={0.9}
            disabled={processing}
          >
            <Text style={S.btnPrimaryText}>
              {processing ? "Procesando compra..." : "Desbloquear EL-VÍA PRO"}
            </Text>
          </TouchableOpacity>

          {/* Botón 2 – Crear acceso / ya pagué */}
          <TouchableOpacity
            style={S.btnSecondary}
            onPress={handleGoToSignUp}
            activeOpacity={0.9}
          >
            <Text style={S.btnSecondaryText}>
              Ya tengo acceso, crear mi usuario
            </Text>
          </TouchableOpacity>

          <Text style={S.note}>
            1) Completa el pago con tu cuenta de Google.{"\n"}
            2) Luego crea tu usuario y contraseña para guardar tu progreso y
            generar tu certificado con tu nombre completo.{"\n"}
            3) Si ya tenías acceso, solo inicia sesión desde la pantalla
            principal.
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
  btnDisabled: {
    opacity: 0.7,
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
