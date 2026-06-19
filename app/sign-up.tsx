// app/sign-up.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

WebBrowser.maybeCompleteAuthSession();

const LOGO = require("../assets/elvia-logo.png");
const GOOGLE_SIGNIN = require("../assets/icons/google-signin.png");

// IDs de cliente OAuth
const GOOGLE_WEB_CLIENT_ID =
  "301738681066-rr4n7uh9qrus99gqcgpp0pui14e01i7g.apps.googleusercontent.com";

const GOOGLE_ANDROID_CLIENT_ID =
  "301738681066-j77lo611n6392l2tik0vs6vaekc66ar6.apps.googleusercontent.com";

export default function SignUpScreen() {
  const router = useRouter();
  const { setName, setPaid } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Si Firebase ya tiene usuario, mandamos directo a /home
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        console.log("Sign-up detecta usuario activo, navegando a /home");
        router.replace("/home");
      }
    });
    return unsub;
  }, []);

  // 🔑 Configuración Google Auth: un solo clientId según plataforma
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      Platform.OS === "android"
        ? GOOGLE_ANDROID_CLIENT_ID
        : GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });

  // Manejar respuesta de Google → Firebase Auth
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!response) return;

      try {
        console.log("Google response:", JSON.stringify(response));

        if (response.type !== "success") {
          console.log("Google login NO success, type:", response.type);
          return;
        }

        setGoogleLoading(true);
        setError(null);

        const anyResponse: any = response;

        // Intentamos ambas formas de obtener el idToken
        const idToken =
          anyResponse?.authentication?.idToken ||
          anyResponse?.params?.id_token;

        console.log("idToken presente:", !!idToken);

        if (!idToken) {
          Alert.alert(
            "Error",
            "No pudimos obtener el token de Google. Intenta de nuevo."
          );
          return;
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);

        const gUser = result.user;
        console.log("Firebase Google user UID:", gUser.uid);

        const displayName =
          fullName.trim() ||
          gUser.displayName ||
          gUser.email?.split("@")[0] ||
          "";

        if (displayName) {
          await setName(displayName);
        }

        await setPaid(true);

        if (gUser.email) {
          await AsyncStorage.setItem("elvia:auth:email", gUser.email);
        }

        console.log("Navegando a /home desde Google Sign-In");
        router.replace("/home");
      } catch (e: any) {
        console.log("Error en handleGoogleResponse:", e);
        Alert.alert(
          "Error",
          "No pudimos completar el acceso con Google. Intenta de nuevo."
        );
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (!request) {
      Alert.alert(
        "Espera",
        "Aún estamos preparando el acceso con Google. Intenta de nuevo en unos segundos."
      );
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      await promptAsync();
    } catch (e: any) {
      console.log("Error en promptAsync Google:", e);
      Alert.alert(
        "Error",
        "No pudimos abrir el acceso con Google. Revisa tu conexión e intenta de nuevo."
      );
      setGoogleLoading(false);
    }
  };

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

      await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await setName(trimmedName);
      await setPaid(true);
      await AsyncStorage.setItem("elvia:auth:email", trimmedEmail);

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
        {/* MINI HERO */}
        <View style={S.logoWrap}>
          <Image source={LOGO} style={S.logo} resizeMode="contain" />
          <Text style={S.heroTitle}>
            Crea tu acceso gratuito para entrenar inspecciones DOT con IA.
          </Text>
          <Text style={S.heroSub}>
            Toma menos de 30 segundos. Tu certificado final usará este nombre.
          </Text>
        </View>

        <View style={S.card}>
          {/* BOTÓN GOOGLE */}
          <Pressable
            style={[S.googleBtn, (googleLoading || !request) && S.btnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || !request}
          >
            {googleLoading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <View style={S.googleInner}>
                <Image
                  source={GOOGLE_SIGNIN}
                  style={S.googleLogo}
                  resizeMode="contain"
                />
              </View>
            )}
          </Pressable>

          <View style={S.separatorRow}>
            <View style={S.separatorLine} />
            <Text style={S.separatorText}>o crea tu acceso con tu correo</Text>
            <View style={S.separatorLine} />
          </View>

          {/* FORMULARIO */}
          <Text style={S.sectionLabel}>Datos para tu certificado</Text>

          <Text style={S.label}>Nombre completo</Text>
          <TextInput
            style={S.input}
            placeholder="Nombre y apellidos"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
          <Text style={S.helperText}>
            Así aparecerá en tu certificado oficial EL-VÍA.
          </Text>

          <Text style={[S.sectionLabel, { marginTop: 16 }]}>
            Datos de acceso
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
  heroTitle: {
    color: ROSEN.colors.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  heroSub: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  card: {
    backgroundColor: ROSEN.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROSEN.colors.border,
    padding: 20,
  },

  // Google button
  googleBtn: {
    backgroundColor: "#F9FAFB",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 16,
  },
  googleInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogo: {
    width: "100%",
    height: 36,
  },

  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148,163,184,0.5)",
  },
  separatorText: {
    color: ROSEN.colors.mute,
    fontSize: 11,
  },

  sectionLabel: {
    color: ROSEN.colors.mute,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  label: {
    color: ROSEN.colors.roseDeep,
    fontWeight: "800",
    marginTop: 8,
  },
  helperText: {
    color: ROSEN.colors.mute,
    fontSize: 11,
    marginTop: 2,
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
