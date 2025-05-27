import { getWepinSDK } from "./wepinSDK";

export const getWepinProvider = async () => {
  try {
    const wepin = getWepinSDK();
    if (!wepin.isInitialized()) {
      throw new Error("Wepin SDK not initialized");
    }
    
    // Get the provider from Wepin SDK
    // This will be used for Web3 interactions
    const provider = await (wepin as any).getProvider({
      network: 'ethereum' // or the network you want to use
    });
    
    return provider;
  } catch (error) {
    console.error("Get Wepin provider error:", error);
    throw error;
  }
};