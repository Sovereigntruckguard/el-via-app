// app/terms.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROSEN } from "../lib/rosen";

export default function Terms() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.body}>
        <Text style={S.title}>Términos de Servicio</Text>
        <Text style={S.updated}>Última actualización: 03/12/2025</Text>

        <Text style={S.section}>
          Al usar EL-VÍA DOT Express (“EL-VÍA”), aceptas estos Términos de
          Servicio.
        </Text>

        <Text style={S.heading}>1. Uso permitido</Text>
        <Text style={S.section}>
          El acceso es personal e intransferible. Está prohibido compartir tu
          cuenta, distribuir contenido o manipular resultados.
        </Text>

        <Text style={S.heading}>2. Cuenta y acceso</Text>
        <Text style={S.section}>
          Tu correo y contraseña son tu responsabilidad. Usa siempre el mismo
          correo del pago.
        </Text>

        <Text style={S.heading}>3. Contenido del programa</Text>
        <Text style={S.section}>
          Incluye módulos, audios, roleplays, exámenes y certificado. Puede
          actualizarse sin previo aviso.
        </Text>

        <Text style={S.heading}>4. Certificado</Text>
        <Text style={S.section}>
          Para obtener el certificado debes completar el programa y aprobar los
          exámenes.
        </Text>

        <Text style={S.heading}>5. Limitación de responsabilidad</Text>
        <Text style={S.section}>
          EL-VÍA no reemplaza capacitación DOT ni asume responsabilidad por
          sanciones, accidentes o decisiones operativas.
        </Text>

        <Text style={S.heading}>6. Propiedad intelectual</Text>
        <Text style={S.section}>
          Todo el contenido es propiedad exclusiva de Solyón Technologies LLC.
        </Text>

        <Text style={S.heading}>7. Suspensión</Text>
        <Text style={S.section}>
          Podemos suspender cuentas que violen estos términos.
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
