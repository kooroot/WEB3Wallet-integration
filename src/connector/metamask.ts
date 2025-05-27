import { injected } from "wagmi/connectors";

export const metamaskConnector = injected({
  target: {
    id: "io.metamask",
    name: "MetaMask",
    provider: (window) => {
      if (typeof window !== "undefined" && window.ethereum?.isMetaMask) {
        return window.ethereum;
      }
    },
  },
});
