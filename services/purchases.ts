// services/purchases.ts
import Purchases, {
    CustomerInfo,
    PURCHASES_ERROR_CODE,
} from "react-native-purchases";

const PRO_ENTITLEMENT_ID = "pro_access";
const PRO_PRODUCT_ID = "elvia_pro_1999";

/**
 * Verifica si el usuario tiene acceso PRO (entitlement activo).
 */
export async function checkProAccess(): Promise<boolean> {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    const isPro =
      customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

    return isPro;
  } catch (error) {
    console.warn("[Purchases] checkProAccess error", error);
    return false;
  }
}

/**
 * Intenta comprar EL-VÍA PRO (pago único).
 * Devuelve:
 *  - success: true si quedó PRO
 *  - cancelled: true si el usuario canceló el pago
 */
export async function purchasePro(): Promise<{
  success: boolean;
  cancelled?: boolean;
}> {
  try {
    const { customerInfo } = await Purchases.purchaseProduct(PRO_PRODUCT_ID);

    const isPro =
      customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

    return { success: isPro, cancelled: !isPro };
  } catch (error: any) {
    if (
      error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      // Usuario canceló el pago
      return { success: false, cancelled: true };
    }

    console.warn("[Purchases] purchasePro error", error);
    return { success: false };
  }
}

/**
 * Restaura compras (útil si cambia de dispositivo o reinstala).
 */
export async function restorePro(): Promise<boolean> {
  try {
    const customerInfo: CustomerInfo = await Purchases.restorePurchases();
    const isPro =
      customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] != null;

    return isPro;
  } catch (error) {
    console.warn("[Purchases] restorePro error", error);
    return false;
  }
}
