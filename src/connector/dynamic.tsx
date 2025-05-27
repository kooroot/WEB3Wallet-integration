import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { type ReactNode, useEffect, useState } from "react";
import { anvil, sepolia } from "../wagmi";

interface DynamicConfigProps {
  children: ReactNode;
}

function DynamicErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#fff3cd", 
      border: "1px solid #ffeaa7",
      borderRadius: "4px",
      margin: "10px"
    }}>
      <h3 style={{ color: "#856404", margin: "0 0 10px 0" }}>Dynamic Initialization Error</h3>
      <p style={{ color: "#856404", margin: 0 }}>{error.message}</p>
    </div>
  );
}

export function DynamicConfig({ children }: DynamicConfigProps) {
  const [error, setError] = useState<Error | null>(null);
  const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

  useEffect(() => {
    // Validate Environment ID
    if (!environmentId) {
      const err = new Error("Dynamic Environment ID is missing. Please set VITE_DYNAMIC_ENVIRONMENT_ID in your environment variables.");
      setError(err);
      return;
    }

    // Validate Environment ID format (Dynamic Environment IDs are UUIDs)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(environmentId)) {
      const err = new Error("Invalid Dynamic Environment ID format. Expected a valid UUID.");
      setError(err);
      return;
    }
  }, [environmentId]);

  if (error) {
    return <DynamicErrorFallback error={error} />;
  }

  if (!environmentId) {
    return <DynamicErrorFallback error={new Error("Dynamic Environment ID is not configured")} />;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [
            {
              blockExplorerUrls: anvil.blockExplorers?.default ? [anvil.blockExplorers.default.url] : [],
              chainId: anvil.id,
              chainName: anvil.name,
              iconUrls: [],
              name: anvil.name,
              nativeCurrency: anvil.nativeCurrency,
              networkId: anvil.id,
              rpcUrls: [anvil.rpcUrls.default.http[0]],
              vanityName: anvil.name,
            },
            {
              blockExplorerUrls: sepolia.blockExplorers?.default ? [sepolia.blockExplorers.default.url] : [],
              chainId: sepolia.id,
              chainName: sepolia.name,
              iconUrls: [],
              name: sepolia.name,
              nativeCurrency: sepolia.nativeCurrency,
              networkId: sepolia.id,
              rpcUrls: [sepolia.rpcUrls.default.http[0]],
              vanityName: sepolia.name,
            },
          ],
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
