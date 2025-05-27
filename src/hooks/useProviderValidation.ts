import { useEffect, useState } from "react";

interface ProviderValidationResult {
  errors: Record<string, string>;
  isValid: (provider: string) => boolean;
}

export function useProviderValidation(): ProviderValidationResult {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const validationErrors: Record<string, string> = {};

    // Check Privy App ID
    const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
    if (!privyAppId) {
      validationErrors.privy = "Privy App ID is missing. Please set VITE_PRIVY_APP_ID.";
    } else if (!/^[a-z0-9]{20,}$/.test(privyAppId)) {
      validationErrors.privy = "Invalid Privy App ID format.";
    }

    // Check Dynamic Environment ID
    const dynamicEnvId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;
    if (!dynamicEnvId) {
      validationErrors.dynamic = "Dynamic Environment ID is missing. Please set VITE_DYNAMIC_ENVIRONMENT_ID.";
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dynamicEnvId)) {
      validationErrors.dynamic = "Invalid Dynamic Environment ID format (expected UUID).";
    }

    // Check Wepin credentials
    const wepinAppId = import.meta.env.VITE_WEPIN_APP_ID;
    const wepinAppKey = import.meta.env.VITE_WEPIN_APP_KEY;
    
    if (!wepinAppId) {
      validationErrors.wepin = "Wepin App ID is missing. Please set VITE_WEPIN_APP_ID.";
    } else if (!wepinAppKey) {
      validationErrors.wepin = "Wepin App Key is missing. Please set VITE_WEPIN_APP_KEY.";
    } else if (!/^[a-f0-9]{32}$/.test(wepinAppId)) {
      validationErrors.wepin = "Invalid Wepin App ID format (expected 32 char hex).";
    } else if (!wepinAppKey.startsWith('ak_')) {
      validationErrors.wepin = "Invalid Wepin App Key format (should start with 'ak_').";
    }

    // Check for runtime Wepin error
    const wepinRuntimeError = (window as any).__wepinError;
    if (wepinRuntimeError && !validationErrors.wepin) {
      validationErrors.wepin = wepinRuntimeError;
    }

    setErrors(validationErrors);
  }, []);

  const isValid = (provider: string) => !errors[provider];

  return { errors, isValid };
}