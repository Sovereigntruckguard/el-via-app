// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../services/firebase";

type User = {
  uid: string;
  email: string | null;
  name?: string | null;
} | null;

type Ctx = {
  user: User;
  isAuthenticated: boolean;
  isPaid: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  setPaid: (paid: boolean) => Promise<void>;
};

const Auth = createContext<Ctx>({
  user: null,
  isAuthenticated: false,
  isPaid: false,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
  setName: async () => {},
  setPaid: async () => {},
});

const KEY_U = "elvia:user";
const KEY_P = "elvia:isPaid";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Suscribirse a Firebase Auth + cargar flags locales (isPaid, name)
  useEffect(() => {
    let localName: string | null = null;

    (async () => {
      try {
        const u = await AsyncStorage.getItem(KEY_U);
        const p = await AsyncStorage.getItem(KEY_P);
        if (p) setIsPaid(p === "true");
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed && typeof parsed.name === "string") {
            localName = parsed.name;
          }
        }
      } catch (e) {
        console.log("Error leyendo auth local:", e);
      }
    })();

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName ?? localName ?? undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const isAuthenticated = !!user;

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      // onAuthStateChanged actualizará el user
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setIsPaid(false);
    await AsyncStorage.multiRemove([KEY_U, KEY_P]);
  };

  const setName = async (name: string) => {
    const current = auth.currentUser;
    try {
      if (current) {
        await updateProfile(current, { displayName: name });
      }
    } catch (e) {
      console.log("Error actualizando displayName:", e);
    }

    setUser((u) => {
      const next = u ? { ...u, name } : u;
      if (next) {
        AsyncStorage.setItem(KEY_U, JSON.stringify({ name })).catch(() => {});
      }
      return next;
    });
  };

  const setPaid = async (paid: boolean) => {
    setIsPaid(paid);
    await AsyncStorage.setItem(KEY_P, paid ? "true" : "false");
  };

  const value: Ctx = {
    user,
    isAuthenticated,
    isPaid,
    loading,
    signIn,
    signOut,
    setName,
    setPaid,
  };

  return <Auth.Provider value={value}>{children}</Auth.Provider>;
}

export function useAuth() {
  const ctx = useContext(Auth);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
