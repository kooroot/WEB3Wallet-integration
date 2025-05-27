import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import { wepinConnector } from "./connector/wepin";

export const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: { name: "Anvil", url: "http://localhost:8545" },
  },
});

// Export sepolia for use in other components
export { sepolia };

const connectors = () => {
  const connectorsArray: any[] = [];
  
  // Use the dedicated MetaMask connector
  connectorsArray.push(metaMask());

  try {
    connectorsArray.push(wepinConnector());
  } catch (error) {
    console.error("Failed to add Wepin connector:", error);
  }

  return connectorsArray;
};

export const config = createConfig({
  chains: [anvil, sepolia],
  connectors: connectors(),
  transports: {
    [anvil.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}