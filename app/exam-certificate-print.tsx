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

  // 1. Cargamos el nombre desde Auth + AsyncStorage
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

  // 2. Inyectar un poco de CSS para asegurar que se impriman colores / imagen
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const style = document.createElement("style");
      style.id = "elvia-cert-print-style";
      style.innerHTML = `
        @media print {
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `;
      document.head.appendChild(style);
      return () => {
        const existing = document.getElementById("elvia-cert-print-style");
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      };
    }
  }, []);

  // 3. Lanzar el diálogo de impresión cuando el nombre esté listo
  useEffect(() => {
    if (
      Platform.OS === "web" &&
      fullName &&
      typeof window !== "undefined"
    ) {
      const id = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(id);
    }
  }, [fullName]);

  // En mobile no usamos esta pantalla, solo en web
  if (Platform.OS !== "web") {
    return null;
  }

  // 4. Obtener la URL real del PNG para usarla en <img>
  // @ts-ignore
  const certAsset = require("../assets/certificates/elvia_certificate_base.png") as any;
  const src: string = certAsset?.src ?? certAsset;

  return (
    <div
      style={{
        backgroundColor: "#000",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "90vw",
          maxWidth: "1200px",
          aspectRatio: "1248 / 832", // proporción real del certificado
        }}
      >
        {/* Imagen completa del certificado */}
        <img
          src={src}
          alt="Certificado EL-VÍA"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* Nombre colocado en el área que marcaste */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // 🔥 Aquí ajustamos verticalmente el nombre:
            //  - Para subirlo: baja este valor (p.e. 52%)
            //  - Para bajarlo: súbelo (p.e. 58%)
            top: "55%",
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "30px", // tamaño de la fuente del nombre
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            {fullName || "Nombre del participante"}
          </span>
        </div>
      </div>
    </div>
  );
}
