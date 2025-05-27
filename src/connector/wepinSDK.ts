import { WepinSDK } from "@wepin/sdk-js";
import type { Account } from "@wepin/sdk-js";
import type { IWepinUser } from "@wepin/common";

let wepinSDKInstance: WepinSDK | null = null;

export const getWepinSDK = () => {
  if (!wepinSDKInstance) {
    const appId = import.meta.env.VITE_WEPIN_APP_ID;
    const appKey = import.meta.env.VITE_WEPIN_APP_KEY;

    if (!appId || !appKey) {
      throw new Error("Wepin App ID and App Key are required");
    }

    wepinSDKInstance = new WepinSDK({
      appId,
      appKey,
    });
  }
  return wepinSDKInstance;
};

export const initializeWepinSDK = async () => {
  try {
    const wepin = getWepinSDK();
    if (!wepin.isInitialized()) {
      await wepin.init({
        type: 'show',
        defaultLanguage: 'en',
        defaultCurrency: 'USD',
      });
    }
    return wepin;
  } catch (error) {
    console.error("Wepin SDK initialization error:", error);
    throw error;
  }
};

export const loginWithWepin = async (email?: string): Promise<IWepinUser> => {
  try {
    const wepin = await initializeWepinSDK();
    const userInfo = await wepin.loginWithUI({ email });
    return userInfo;
  } catch (error) {
    console.error("Wepin login error:", error);
    throw error;
  }
};

export const getWepinAccounts = async (): Promise<Account[]> => {
  try {
    const wepin = getWepinSDK();
    if (!wepin.isInitialized()) {
      throw new Error("Wepin SDK not initialized");
    }
    const accounts = await wepin.getAccounts();
    return accounts;
  } catch (error) {
    console.error("Get Wepin accounts error:", error);
    throw error;
  }
};

export const logoutWepin = async () => {
  try {
    const wepin = getWepinSDK();
    if (wepin.isInitialized()) {
      await wepin.logout();
    }
  } catch (error) {
    console.error("Wepin logout error:", error);
    throw error;
  }
};

export const openWepinWidget = async () => {
  try {
    const wepin = getWepinSDK();
    if (wepin.isInitialized()) {
      await wepin.openWidget();
    }
  } catch (error) {
    console.error("Open Wepin widget error:", error);
    throw error;
  }
};

export const closeWepinWidget = () => {
  try {
    const wepin = getWepinSDK();
    if (wepin.isInitialized()) {
      wepin.closeWidget();
    }
  } catch (error) {
    console.error("Close Wepin widget error:", error);
  }
};