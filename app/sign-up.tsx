// app/sign-up.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../services/firebase";

const LOGO = require("../assets/elvia-logo.png");

export default function SignUpScreen() {
  const router = useRouter();
  const { setName, setPaid } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirm) {
      setError("Completa todos los campos.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      // 1. Crear usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      // 2. Guardar nombre completo en AuthContext (displayName + AsyncStorage)
      await setName(trimmedName);

      // 3. Marcar acceso de pago localmente
      await setPaid(true);

      // 4. (Opcional) guardar email por referencia local
      await AsyncStorage.setItem("elvia:auth:email", trimmedEmail);

      // 5. Enviar al Home (desde allí entra al manual / módulos)
      router.replace("/home");
    } catch (e: any) {
      console.log("Error signUp:", e);
      const code = e?.code || "";
      if (code.includes("auth/email-already-in-use")) {
        setError("Este correo ya tiene una cuenta. Prueba iniciar sesión.");
      } else if (code.includes("auth/invalid-email")) {
        setError("El correo no tiene un formato válido.");
      } else {
        setError("No pudimos crear tu acceso. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    !fullName || !email || !password || !confirm || loading;

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
          <Text style={S.title}>Crear acceso ELVIA</Text>
          <Text style={S.subtitle}>
            Registra tu cuenta para comenzar el programa y generar tu
            certificado oficial.
          </Text>

          <Text style={S.label}>Nombre completo</Text>
          <TextInput
            style={S.input}
            placeholder="Nombre y apellidos"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />

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

          <Text style={S.label}>Repetir contraseña</Text>
          <TextInput
            style={S.input}
            placeholder="********"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          {error && <Text style={S.error}>{error}</Text>}

          <Pressable
            style={[S.btn, disabled && S.btnDisabled]}
            onPress={handleSignUp}
            disabled={disabled}
          >
            {loading ? (
              <ActivityIndicator color="#181818" />
            ) : (
              <Text style={S.btnText}>Crear mi acceso</Text>
            )}
          </Pressable>

          <Pressable
            style={S.back}
            onPress={() => router.push("/sign-in")}
          >
            <Text style={S.backText}>
              Ya tengo cuenta, ir a iniciar sesión
            </Text>
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
