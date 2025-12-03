// app/sign-in.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ROSEN } from "../lib/rosen";

const LOGO = require("../assets/elvia-logo.png");

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email.trim(), password);
      // Al iniciar sesión vamos al Home (progreso + medallas)
      router.replace("/home");
    } catch (e: any) {
      console.log("Error signIn:", e);
      const code = e?.code || "";
      if (code.includes("auth/invalid-email")) {
        setError("El correo no tiene un formato válido.");
      } else if (
        code.includes("auth/user-not-found") ||
        code.includes("auth/wrong-password") ||
        code.includes("auth/invalid-credential")
      ) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("No pudimos iniciar sesión. Intenta de nuevo.");
      }
    }
  };

  const disabled = !email || !password || loading;

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView
        style={S.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* LOGO arriba centrado */}
        <View style={S.logoWrap}>
          <Image source={LOGO} style={S.logo} resizeMode="contain" />
        </View>

        <View style={S.card}>
          <Text style={S.title}>Acceso a ELVIA</Text>
          <Text style={S.subtitle}>
            Ingresa con tu correo y contraseña para continuar tu entrenamiento.
          </Text>

          <Text style={S.label}>Correo electrónico</Text>
          <TextInput
            style={S.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={S.label}>Contraseña</Text>
          <TextInput
            style={S.input}
            placeholder="********"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={S.error}>{error}</Text>}

          <Pressable
            style={[S.btn, disabled && S.btnDisabled]}
            onPress={handleSignIn}
            disabled={disabled}
          >
            {loading ? (
              <ActivityIndicator color="#181818" />
            ) : (
              <Text style={S.btnText}>Entrar a ELVIA</Text>
            )}
          </Pressable>

          <Pressable style={S.back} onPress={() => router.back()}>
            <Text style={S.backText}>← Volver</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 120,
    height: 60,
    opacity: 0.98,
  },
  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 20,
  },
  title: {
    color: ROSEN.colors.white,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: ROSEN.colors.mute,
    marginBottom: 18,
  },
  label: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "800",
    marginTop: 8,
  },
  input: {
    marginTop: 4,
    backgroundColor: "#111111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  error: {
    color: "#f97316",
    marginTop: 10,
    fontSize: 13,
  },
  btn: {
    marginTop: 16,
    backgroundColor: ROSEN.colors.rose,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ROSEN.colors.roseDeep,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#181818",
    fontWeight: "900",
  },
  back: {
    marginTop: 12,
    alignItems: "center",
  },
  backText: {
    color: ROSEN.colors.rose,
    fontWeight: "700",
  },
});
