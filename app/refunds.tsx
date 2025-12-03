// app/refunds.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROSEN } from "../lib/rosen";

export default function Refunds() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.body}>
        <Text style={S.title}>Política de Reembolsos</Text>
        <Text style={S.updated}>Última actualización: 03/12/2025</Text>

        <Text style={S.heading}>1. Garantía de 7 días</Text>
        <Text style={S.section}>
          Puedes solicitar un reembolso dentro de los primeros 7 días siempre
          que no hayas completado más del 30% del curso o generado tu
          certificado.
        </Text>

        <Text style={S.heading}>2. Cómo solicitar un reembolso</Text>
        <Text style={S.section}>
          Envía un correo a {"\n"}
          pagos@solyontechnologies.com {"\n"}
          Incluye nombre, correo, fecha de compra y comprobante Stripe.
        </Text>

        <Text style={S.heading}>3. Métodos de reembolso</Text>
        <Text style={S.section}>
          Se devuelve el dinero al método original mediante Stripe.
        </Text>

        <Text style={S.heading}>4. Casos donde no aplica</Text>
        <Text style={S.section}>
          • Más de 7 días desde la compra{"\n"}
          • Curso completado{"\n"}
          • Certificado generado{"\n"}
          • Intentos fraudulentos
        </Text>

        <Pressable style={S.btn} onPress={() => router.back()}>
          <Text style={S.btnText}>← Volver</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ROSEN.colors.black },
  container: { flex: 1 },
  body: { padding: 20 },
  title: {
    color: ROSEN.colors.white,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  updated: { color: ROSEN.colors.mute, fontSize: 12, marginBottom: 18 },
  heading: {
    color: ROSEN.colors.rose,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 16,
  },
  section: {
    color: ROSEN.colors.white,
    marginTop: 6,
    lineHeight: 20,
  },
  btn: {
    marginTop: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: ROSEN.colors.rose,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: ROSEN.colors.rose, fontWeight: "800" },
});
