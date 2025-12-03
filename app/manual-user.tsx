// app/manual-user.tsx
import { useRouter } from "expo-router";
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROSEN } from "../lib/rosen";

export default function ManualUser() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        style={S.container}
        contentContainerStyle={S.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={S.title}>Manual de uso ELVIA · DOT Express</Text>
        <Text style={S.subtitle}>
          Guía rápida para aprovechar al máximo tu acceso, paso a paso.
        </Text>

        {/* 1. Acceso y registro */}
        <Text style={S.heading}>1. Acceso y registro</Text>
        <Text style={S.section}>
          1. Abre{" "}
          <Text style={S.bold}>elvia.solyontechnologies.com</Text>{" "}
          desde tu celular o computador.{"\n"}
          2. Si aún no has comprado, toca{" "}
          <Text style={S.bold}>“Comprar acceso”</Text> y realiza el pago seguro
          con Stripe.{"\n"}
          3. Después del pago, toca{" "}
          <Text style={S.bold}>“Ya pagué, crear mi acceso”</Text> y regístrate
          con tu{" "}
          <Text style={S.bold}>nombre completo</Text>, correo y contraseña.{"\n"}
          4. Si ya tienes cuenta, usa{" "}
          <Text style={S.bold}>“Ya tengo acceso”</Text> e ingresa con tu correo
          y contraseña.
        </Text>

        {/* 2. Pantalla de inicio (Home) */}
        <Text style={S.heading}>2. Pantalla de inicio (Home)</Text>
        <Text style={S.section}>
          - Aquí verás tu{" "}
          <Text style={S.bold}>progreso total</Text> y tus{" "}
          <Text style={S.bold}>medallas</Text>.{"\n"}
          - Desde esta pantalla puedes entrar a:{"\n"}
          • <Text style={S.bold}>Bienvenida y orientación</Text>{" "}
          (introducción al curso).{"\n"}
          • <Text style={S.bold}>Manual bilingüe</Text>{" "}
          (Plan 7 días, módulos y exámenes).{"\n"}
          • En la parte inferior siempre tendrás acceso a{" "}
          <Text style={S.bold}>Privacidad, Términos y Reembolsos</Text>.
        </Text>

        {/* 3. Cómo avanzar en el programa */}
        <Text style={S.heading}>3. Cómo avanzar en el programa</Text>
        <Text style={S.section}>
          1. Entra a{" "}
          <Text style={S.bold}>“Manual bilingüe”</Text>.{"\n"}
          2. Completa los módulos en este orden recomendado:{"\n"}
          • Frases con inspector{"\n"}
          • Señales de tránsito{"\n"}
          • Roleplays (simulaciones){"\n"}
          • Pronunciación{"\n"}
          3. Cada módulo tiene su propio progreso y retroalimentación con IA.{"\n"}
          4. Cuando un módulo esté{" "}
          <Text style={S.bold}>100% completado</Text> verás mensajes y botones
          que te llevan al{" "}
          <Text style={S.bold}>examen correspondiente</Text>.
        </Text>

        {/* 4. Exámenes y certificado */}
        <Text style={S.heading}>4. Exámenes y certificado</Text>
        <Text style={S.section}>
          - Los exámenes se encuentran en el{" "}
          <Text style={S.bold}>plan de 7 días</Text>:{"\n"}
          • Examen frases con inspector.{"\n"}
          • Examen señales de tránsito.{"\n"}
          • Examen final certificable.{"\n"}
          - Debes aprobar con al menos{" "}
          <Text style={S.bold}>80%</Text> cada uno para desbloquear el
          siguiente.{"\n"}
          - Al aprobar todo el recorrido se activa tu{" "}
          <Text style={S.bold}>certificado ELVIA</Text>, con tu nombre
          completo.
        </Text>

        {/* 5. Buenas prácticas de uso */}
        <Text style={S.heading}>5. Buenas prácticas de uso</Text>
        <Text style={S.section}>
          • Usa audífonos para escuchar mejor las frases y roleplays.{"\n"}
          • Habla en voz alta y repite, no solo leas.{"\n"}
          • Repite los módulos donde sientas más dificultad.{"\n"}
          • Completa el programa en 7 días, pero tendrás acceso permanente.
        </Text>

        {/* 6. Soporte y ayuda */}
        <Text style={S.heading}>6. Soporte y ayuda</Text>
        <Text style={S.section}>
          Si necesitas ayuda con tu acceso, pago o certificado, puedes
          escribirnos a:{"\n"}
          <Text style={S.bold}>soporte@solyontechnologies.com</Text>{"\n"}
          o{" "}
          <Text style={S.bold}>pagos@solyontechnologies.com</Text> para temas de
          cobros y reembolsos.
        </Text>

        <Pressable style={S.btn} onPress={() => router.back()}>
          <Text style={S.btnText}>← Volver</Text>
        </Pressable>
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
  },
  body: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    color: ROSEN.colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    color: ROSEN.colors.mute,
    marginBottom: 14,
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
  bold: {
    fontWeight: "900",
  },
  btn: {
    marginTop: 26,
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
