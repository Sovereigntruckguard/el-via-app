// services/certificate.ts
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type CertificateData = {
  fullName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
  certificateId: string;
};

type CertificateImage = {
  base64: string;
  width: number;
  height: number;
};

async function getCertificateImage(): Promise<CertificateImage> {
  // Asegúrate de que ESTE archivo sea el certificado COMPLETO:
  // assets/certificates/elvia_certificate_base.png
  const asset = Asset.fromModule(
    require("../assets/certificates/elvia_certificate_base.png")
  );
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error("No se pudo cargar la plantilla del certificado.");
  }

  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: "base64" as any,
  });

  const width = asset.width ?? 1920;
  const height = asset.height ?? 1080;

  return { base64, width, height };
}

function buildCertificateHtml(data: CertificateData, base64Image: string) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1, width=device-width" />
      <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&display=swap" rel="stylesheet" />
      <style>
        @page {
          margin: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #000000;
        }

        .page {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000000;
        }

        .bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 100%;
          max-height: 100%;
          width: 100%;
          height: 100%;
          object-fit: contain;   /* imagen completa, sin recorte */
          z-index: 1;
        }

        .name-overlay {
          position: absolute;
          top: 59.5%;   /* ajusta si quieres subir/bajar el nombre */
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 4;

          font-family: "Great Vibes", "Allura", cursive;
          font-size: 52px;
          font-weight: 400;
          text-align: center;
          white-space: nowrap;

          color: #ffffff;                    /* dorado */
          -webkit-text-stroke: 2px #FFD700;  /* borde blanco */
          text-shadow:
            0 0 6px rgba(0,0,0,0.7),
            0 0 12px rgba(0,0,0,0.4);
        }
      </style>
    </head>
    <body>
      <div class="page">
        <img src="data:image/png;base64,${base64Image}" class="bg" />
        <div class="name-overlay">${data.fullName}</div>
      </div>
    </body>
  </html>
  `;
}

export async function openCertificateFlow(data: CertificateData) {
  const { base64, width, height } = await getCertificateImage();
  const html = buildCertificateHtml(data, base64);

  const pageWidth = width;
  const pageHeight = height;

  if (Platform.OS === "web") {
    await Print.printAsync({
      html,
      width: pageWidth,
      height: pageHeight,
    });
    return;
  }

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: pageWidth,
      height: pageHeight,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      try {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir certificado EL-VÍA",
        });
      } catch (err: any) {
        const msg = err?.message || "";
        // Ignoramos específicamente el caso de "otro share en proceso"
        if (
          typeof msg === "string" &&
          msg.includes("Another share request is being processed now")
        ) {
          console.log("Share ya en curso, se ignora error:", msg);
          return;
        }
        throw err;
      }
    }
  } catch (error) {
    console.error("Error generando/compartiendo certificado:", error);
    throw error;
  }
}
