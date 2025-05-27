import { PrivyClientConfig, PrivyProvider } from "@privy-io/react-auth";
import { PrivyWagmiConnector } from "@privy-io/wagmi-connector";
import { type ReactNode } from "react";
import { anvil } from "../wagmi";

interface PrivyWagmiConfigProps {
  children: ReactNode;
}

export function PrivyWagmiConfig({ children }: PrivyWagmiConfigProps) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;

  const privyConfig: PrivyClientConfig = {
    appearance: {
      theme: "light",
      accentColor: "#676FFF",
    },
    loginMethods: ["email", "wallet"],
    embeddedWallets: {
      createOnLogin: "users-without-wallets",
    },
  };

  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <PrivyWagmiConnector wagmiChainsConfig={[anvil]}>
        {children}
      </PrivyWagmiConnector>
    </PrivyProvider>
  );
}