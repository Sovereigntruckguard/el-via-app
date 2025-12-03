// app/privacy.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROSEN } from "../lib/rosen";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.body}>
        <Text style={S.title}>Política de Privacidad</Text>
        <Text style={S.updated}>Última actualización: 03/12/2025</Text>

        <Text style={S.section}>
          EL-VÍA DOT Express (“EL-VÍA”, “nosotros”) protege y respeta tu
          información. Al usar nuestra plataforma, aceptas esta Política de
          Privacidad.
        </Text>

        <Text style={S.heading}>1. Información que recopilamos</Text>
        <Text style={S.section}>
          • Nombre completo{"\n"}
          • Correo electrónico{"\n"}
          • Contraseña (encriptada por Firebase){"\n"}
          • Progreso del curso y exámenes{"\n"}
          • IP, dispositivo, estadísticas de uso{"\n"}
          • Nombre para certificado
        </Text>

        <Text style={S.heading}>2. Cómo usamos tu información</Text>
        <Text style={S.section}>
          • Crear tu cuenta{"\n"}
          • Guardar tu progreso{"\n"}
          • Emitir tu certificado{"\n"}
          • Mejorar seguridad y funcionamiento del sistema{"\n"}
          • Comunicaciones esenciales
        </Text>

        <Text style={S.heading}>3. Tecnologías utilizadas</Text>
        <Text style={S.section}>
          • Firebase Auth{"\n"}
          • Google Cloud – Backend{"\n"}
          • Vercel – Frontend{"\n"}
          • Cloudflare – DNS y seguridad
        </Text>

        <Text style={S.heading}>4. Seguridad</Text>
        <Text style={S.section}>
          Protegemos tu información mediante HTTPS, autenticación segura y
          accesos controlados.
        </Text>

        <Text style={S.heading}>5. Derechos del usuario</Text>
        <Text style={S.section}>
          Puedes solicitar la eliminación de tu cuenta o datos escribiendo a:
          legal@solyontechnologies.com
        </Text>

        <Text style={S.heading}>6. Retención de datos</Text>
        <Text style={S.section}>
          Guardamos tu información mientras tu cuenta esté activa. Si solicitas
          eliminación, se ejecutará en máximo 7 días.
        </Text>

        <Text style={S.heading}>7. Modificaciones</Text>
        <Text style={S.section}>
          Podemos actualizar esta política sin previo aviso. La versión vigente
          estará siempre disponible en esta página.
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
  updated: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    marginBottom: 18,
  },
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
  btnText: {
    color: ROSEN.colors.rose,
    fontWeight: "800",
  },
});
