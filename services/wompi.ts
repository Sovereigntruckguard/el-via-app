// services/wompi.ts
import { Linking } from "react-native";

// Reemplaza este link por el link real de Wompi que creaste
const WOMPI_PAYMENT_URL = "https://checkout.wompi.co/l/TImLGQ";

export async function openWompiCheckout() {
  try {
    const supported = await Linking.canOpenURL(WOMPI_PAYMENT_URL);
    if (!supported) {
      alert(
        "No se pudo abrir el enlace de pago. Intenta desde el navegador o contáctanos."
      );
      return;
    }
    await Linking.openURL(WOMPI_PAYMENT_URL);
  } catch (e) {
    console.log("Error abriendo Wompi:", e);
    alert("Ocurrió un error al abrir el pago. Intenta de nuevo.");
  }
}
