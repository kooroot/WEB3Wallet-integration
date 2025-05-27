import { Buffer } from "buffer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { DynamicConfig } from "./connector/dynamic.tsx";
import { PrivyConfig } from "./connector/privy.tsx";
import { config } from "./wagmi.ts";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

import "./index.css";

// @ts-ignore
globalThis.Buffer = Buffer;

const queryClient = new QueryClient();

function AppWithProviders() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <PrivyConfig>
            <DynamicConfig>
              <App />
            </DynamicConfig>
          </PrivyConfig>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>,
);
