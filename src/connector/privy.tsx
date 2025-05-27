import { PrivyProvider } from "@privy-io/react-auth";
import { type ReactNode, useEffect, useState } from "react";
import { anvil, sepolia } from "../wagmi";

interface PrivyConfigProps {
  children: ReactNode;
}

function PrivyErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#fff3cd", 
      border: "1px solid #ffeaa7",
      borderRadius: "4px",
      margin: "10px"
    }}>
      <h3 style={{ color: "#856404", margin: "0 0 10px 0" }}>Privy Initialization Error</h3>
      <p style={{ color: "#856404", margin: 0 }}>{error.message}</p>
    </div>
  );
}

export function PrivyConfig({ children }: PrivyConfigProps) {
  const [error, setError] = useState<Error | null>(null);
  const appId = import.meta.env.VITE_PRIVY_APP_ID;

  useEffect(() => {
    // Validate App ID
    if (!appId) {
      const err = new Error("Privy App ID is missing. Please set VITE_PRIVY_APP_ID in your environment variables.");
      setError(err);
      return;
    }

    // Validate App ID format (Privy App IDs are typically alphanumeric strings)
    const appIdPattern = /^[a-z0-9]{20,}$/;
    if (!appIdPattern.test(appId)) {
      const err = new Error("Invalid Privy App ID format. Please check your VITE_PRIVY_APP_ID.");
      setError(err);
      return;
    }
  }, [appId]);

  if (error) {
    return <PrivyErrorFallback error={error} />;
  }

  if (!appId) {
    return <PrivyErrorFallback error={new Error("Privy App ID is not configured")} />;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: anvil,
        supportedChains: [anvil, sepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
