import { wepinWallet } from "@wepin/wagmi-connector";
import { WepinLogin } from "@wepin/login-js";

export class WepinValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WepinValidationError";
  }
}

export const validateWepinCredentials = () => {
  const appId = import.meta.env.VITE_WEPIN_APP_ID;
  const appKey = import.meta.env.VITE_WEPIN_APP_KEY;

  // Validate App ID
  if (!appId) {
    throw new WepinValidationError("Wepin App ID is missing. Please set VITE_WEPIN_APP_ID in your environment variables.");
  }

  // Validate App Key
  if (!appKey) {
    throw new WepinValidationError("Wepin App Key is missing. Please set VITE_WEPIN_APP_KEY in your environment variables.");
  }

  // Validate App ID format (Wepin App IDs are typically 32 character hex strings)
  const appIdPattern = /^[a-f0-9]{32}$/;
  if (!appIdPattern.test(appId)) {
    throw new WepinValidationError("Invalid Wepin App ID format. Expected a 32 character hexadecimal string.");
  }

  // Validate App Key format (Wepin App Keys typically start with "ak_")
  if (!appKey.startsWith('ak_')) {
    throw new WepinValidationError("Invalid Wepin App Key format. App Key should start with 'ak_'.");
  }

  return { appId, appKey };
};

export const wepinConnector = () => {
  try {
    const { appId, appKey } = validateWepinCredentials();
    
    return wepinWallet({
      appId,
      appKey,
    });
  } catch (error) {
    console.error("Wepin Connector Error:", error);
    // Return a dummy connector that will fail when used
    throw error;
  }
};

let wepinLoginInstance: WepinLogin | null = null;

export const getWepinLogin = async () => {
  if (!wepinLoginInstance) {
    try {
      const { appId, appKey } = validateWepinCredentials();
      wepinLoginInstance = new WepinLogin({
        appId,
        appKey,
      });
      await wepinLoginInstance.init();
    } catch (error) {
      console.error("Wepin Login initialization error:", error);
      throw error;
    }
  }
  return wepinLoginInstance;
};

export const wepinLogin = async (provider: 'google' | 'naver' | 'discord' | 'apple' | 'email' = 'google') => {
  try {
    const wepinInstance = await getWepinLogin();
    let loginResult;
    
    if (provider === 'email') {
      // For email login, you would need to implement a UI to get email/password
      throw new Error("Email login requires email and password. Use loginWithEmail method instead.");
    } else {
      loginResult = await wepinInstance.loginWithOauthProvider({ provider });
    }
    
    return loginResult;
  } catch (error) {
    console.error("Wepin login error:", error);
    throw error;
  }
};

export const wepinLoginWithEmail = async (email: string, password: string) => {
  try {
    const wepinInstance = await getWepinLogin();
    const loginResult = await wepinInstance.loginWithEmailAndPassword(email, password);
    return loginResult;
  } catch (error) {
    console.error("Wepin email login error:", error);
    throw error;
  }
};

export const wepinLogout = async () => {
  try {
    if (wepinLoginInstance) {
      await wepinLoginInstance.logout();
    }
  } catch (error) {
    console.error("Wepin logout error:", error);
    throw error;
  }
};
