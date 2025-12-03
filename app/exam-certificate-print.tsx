// app/exam-certificate-print.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useAuth } from "../context/AuthContext";

type ExamResult = {
  fullName?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

const STORAGE_KEY = "elvia_exam_final_result";

export default function ExamCertificatePrintScreen() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>("");

  // Cargar nombre desde AsyncStorage + AuthContext
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ExamResult;
          const authName =
            user?.name && user.name.trim().length > 0 ? user.name.trim() : "";
          setFullName(authName || parsed.fullName || "");
        }
      } catch (e) {
        console.error("[CERT_PRINT] Error leyendo resultado:", e);
      }
    })();
  }, [user]);

  // En web: abrir diálogo de impresión cuando todo esté listo
  useEffect(() => {
    if (Platform.OS === "web" && fullName && typeof window !== "undefined") {
      const id = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(id);
    }
  }, [fullName]);

  // Solo nos interesa la vista WEB
  if (Platform.OS !== "web") {
    return null;
  }

  // Obtenemos la URL real del PNG para usarla en <img>
  // @ts-ignore
  const certImg = require("../assets/certificates/elvia_certificate_base.png") as any;
  const src: string = certImg?.src ?? certImg;

  return (
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "90vw",
          maxWidth: "1200px",
          aspectRatio: "1248 / 832",
        }}
      >
        {/* Imagen base del certificado */}
        <img
          src={src}
          alt="Certificado EL-VÍA"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* Nombre en el espacio del certificado */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // Ajusta este % para subir/bajar el nombre hasta que quede perfecto
            top: "45%",
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "28px", // tamaño grande como quieres
              fontWeight: 700,
            }}
          >
            {fullName || "Nombre del participante"}
          </span>
        </div>
      </div>
    </div>
  );
}
