import { useDynamicContext, useDynamicEvents } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { reconnect } from "@wagmi/core";
import { encodeFunctionData, createWalletClient, custom, createPublicClient, http } from "viem";
import { anvil, sepolia, config } from "./wagmi";
import { useProviderValidation } from "./hooks/useProviderValidation";
import { loginWithWepin, getWepinAccounts, openWepinWidget } from "./connector/wepinSDK";
import { WalletInfo } from "./components/WalletInfo";
import { logoutWepin } from "./connector/wepinSDK";
import { NetworkTabs } from "./components/NetworkTabs";
import { COUNTER_ABI, getContractAddress } from "./config/contracts";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const account = useAccount();
  const { connectors, connect, status: connectStatus, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains } = useSwitchChain();
  const [inputNumber, setInputNumber] = useState("");
  const { errors: validationErrors, isValid } = useProviderValidation();
  const [wepinAuthenticated, setWepinAuthenticated] = useState(false);
  const [wepinUser, setWepinUser] = useState<any>(null);
  const [wepinAccounts, setWepinAccounts] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<'anvil' | 'sepolia'>('anvil');

  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    login: privyLogin,
  } = usePrivy();
  
  const { wallets: privyWallets } = useWallets();
  
  const { setShowAuthFlow, user: dynamicUser, primaryWallet } = useDynamicContext();
  const dynamicAuthenticated = !!dynamicUser;

  const [dynamicChainId, setDynamicChainId] = useState<number | undefined>();
  const [privyChainId, setPrivyChainId] = useState<number | undefined>();
  
  // Get Dynamic wallet chain ID
  useEffect(() => {
    if (!dynamicAuthenticated || !primaryWallet || !isEthereumWallet(primaryWallet)) {
      setDynamicChainId(undefined);
      return;
    }

    const getDynamicChainId = async () => {
      try {
        // Get the wallet client from Dynamic
        const walletClient = await primaryWallet.getWalletClient();
        if (walletClient && walletClient.chain) {
          setDynamicChainId(walletClient.chain.id);
        } else {
          // Fallback: try to get from public client
          const publicClient = await primaryWallet.getPublicClient();
          if (publicClient) {
            const chainId = await publicClient.getChainId();
            setDynamicChainId(chainId);
          }
        }
      } catch (error) {
        console.error("Error getting Dynamic chain ID:", error);
      }
    };

    // Get initial chain ID
    getDynamicChainId();
  }, [dynamicAuthenticated, primaryWallet]);

  // Listen for Dynamic network changes
  useDynamicEvents('primaryWalletNetworkChanged', (newNetwork) => {
    console.log('Dynamic network changed to:', newNetwork);
    if (dynamicAuthenticated && primaryWallet && isEthereumWallet(primaryWallet)) {
      // Update chain ID when network changes
      const getDynamicChainId = async () => {
        try {
          const walletClient = await primaryWallet.getWalletClient();
          if (walletClient && walletClient.chain) {
            setDynamicChainId(walletClient.chain.id);
          }
        } catch (error) {
          console.error("Error updating Dynamic chain ID:", error);
        }
      };
      getDynamicChainId();
    }
  });

  const currentChainId = dynamicAuthenticated ? dynamicChainId : (privyAuthenticated ? privyChainId : account.chainId);
  const targetChainId = selectedNetwork === 'anvil' ? anvil.id : sepolia.id;
  const isCorrectNetwork = currentChainId === targetChainId;
  const counterAddress = getContractAddress(targetChainId, 'counter');


  const { data: currentNumber, refetch: refetchNumber } = useReadContract({
    address: counterAddress as `0x${string}`,
    abi: COUNTER_ABI,
    functionName: "number",
    chainId: targetChainId,
    // Enable automatic refetching every 2 seconds when on correct network
    query: {
      refetchInterval: isCorrectNetwork ? 2000 : false,
    },
  });

  const { writeContract: increment, isPending: isIncrementing, data: incrementTxHash } = useWriteContract();
  const { writeContract: setNumber, isPending: isSettingNumber, data: setNumberTxHash } = useWriteContract();

  // Auto-switch network for connected wallets
  useEffect(() => {
    if (account.isConnected && account.chainId && account.chainId !== targetChainId) {
      // Don't auto-switch, let user do it manually
      console.log("Wrong network detected. Current:", account.chainId, "Expected:", targetChainId);
    }
  }, [account.isConnected, account.chainId, targetChainId]);

  // Handle Wepin account selection
  useEffect(() => {
    if (wepinAuthenticated && wepinAccounts.length > 0) {
      // You can also open the widget to let user manage accounts
      // openWepinWidget();
    }
  }, [wepinAuthenticated, wepinAccounts]);

  // Update chain ID when Privy wallet changes
  useEffect(() => {
    if (!privyAuthenticated || privyWallets.length === 0) {
      setPrivyChainId(undefined);
      return;
    }

    const updatePrivyChainId = async () => {
      try {
        const wallet = privyWallets[0];
        // Get the current chain from the wallet
        const provider = await wallet.getEthereumProvider();
        if (provider) {
          const chainId = await provider.request({ method: 'eth_chainId' });
          // Convert hex to number
          const chainIdNumber = parseInt(chainId as string, 16);
          setPrivyChainId(chainIdNumber);
        }
      } catch (error) {
        console.error('Error getting Privy chain ID:', error);
      }
    };
    
    // Get initial chain ID
    updatePrivyChainId();
    
    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
      setPrivyChainId(chainIdNumber);
    };

    // Set up event listener for chain changes
    let provider: any;
    const setupListener = async () => {
      provider = await privyWallets[0]?.getEthereumProvider();
      if (provider && provider.on) {
        provider.on('chainChanged', handleChainChanged);
      }
    };
    setupListener();

    return () => {
      // Clean up event listener
      if (provider && provider.removeListener) {
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [privyAuthenticated, privyWallets]);



  // Wait for transaction confirmations
  const { isLoading: isIncrementConfirming, isSuccess: isIncrementSuccess } = useWaitForTransactionReceipt({
    hash: incrementTxHash,
  });

  const { isLoading: isSetNumberConfirming, isSuccess: isSetNumberSuccess } = useWaitForTransactionReceipt({
    hash: setNumberTxHash,
  });

  // Refetch number when transaction is confirmed
  useEffect(() => {
    if (isIncrementSuccess || isSetNumberSuccess) {
      refetchNumber();
    }
  }, [isIncrementSuccess, isSetNumberSuccess, refetchNumber]);

  // Get wallet type for current connection
  const getWalletType = () => {
    if (account.connector?.name === "Wepin") return "wepin";
    if (privyAuthenticated && privyWallets.length > 0) return "privy";
    if (dynamicAuthenticated && primaryWallet) return "dynamic";
    if (account.connector?.name === "MetaMask" && !dynamicAuthenticated) return "metamask";
    return "unknown";
  };

  const walletType = getWalletType();

  const handleIncrement = async () => {
    try {
      // For Dynamic, use their native SDK
      if (walletType === "dynamic" && primaryWallet && isEthereumWallet(primaryWallet)) {
        // Get wallet client
        const walletClient = await primaryWallet.getWalletClient();
        const publicClient = await primaryWallet.getPublicClient();
        
        // Create transaction data
        const data = encodeFunctionData({
          abi: COUNTER_ABI,
          functionName: "increment",
        });
        
        // Send transaction
        const hash = await walletClient.sendTransaction({
          to: counterAddress as `0x${string}`,
          data,
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          account: walletClient.account,
        });
        
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === 'success') {
          refetchNumber();
        }
      } else if (walletType === "privy" && privyWallets.length > 0) {
        // For Privy, use viem with their provider
        const wallet = privyWallets[0];
        const provider = await wallet.getEthereumProvider();
        
        // Create wallet client with Privy provider
        const walletClient = createWalletClient({
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          transport: custom(provider),
        });
        
        // Send transaction
        const hash = await walletClient.writeContract({
          address: counterAddress as `0x${string}`,
          abi: COUNTER_ABI,
          functionName: "increment",
          account: wallet.address as `0x${string}`,
        });
        
        // Wait for transaction receipt
        const publicClient = createPublicClient({
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          transport: http(),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === 'success') {
          refetchNumber();
        }
      } else {
        // For other wallets (MetaMask, Wepin), use wagmi
        await increment({
          address: counterAddress as `0x${string}`,
          abi: COUNTER_ABI,
          functionName: "increment",
          chainId: targetChainId,
        });
      }
    } catch (error: any) {
      console.error("Error incrementing:", error);
      alert(`Error sending transaction: ${error.message || "Please check your wallet and network."}`);
    }
  };

  const handleSetNumber = async () => {
    if (!inputNumber) return;
    try {
      // For Dynamic, use their native SDK
      if (walletType === "dynamic" && primaryWallet && isEthereumWallet(primaryWallet)) {
        // Get wallet client
        const walletClient = await primaryWallet.getWalletClient();
        const publicClient = await primaryWallet.getPublicClient();
        
        // Create transaction data
        const data = encodeFunctionData({
          abi: COUNTER_ABI,
          functionName: "setNumber",
          args: [BigInt(inputNumber)],
        });
        
        // Send transaction
        const hash = await walletClient.sendTransaction({
          to: counterAddress as `0x${string}`,
          data,
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          account: walletClient.account,
        });
        
        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === 'success') {
          setInputNumber("");
          refetchNumber();
        }
      } else if (walletType === "privy" && privyWallets.length > 0) {
        // For Privy, use viem with their provider
        const wallet = privyWallets[0];
        const provider = await wallet.getEthereumProvider();
        
        // Create wallet client with Privy provider
        const walletClient = createWalletClient({
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          transport: custom(provider),
        });
        
        // Send transaction
        const hash = await walletClient.writeContract({
          address: counterAddress as `0x${string}`,
          abi: COUNTER_ABI,
          functionName: "setNumber",
          args: [BigInt(inputNumber)],
          account: wallet.address as `0x${string}`,
        });
        
        // Wait for transaction receipt
        const publicClient = createPublicClient({
          chain: selectedNetwork === 'anvil' ? anvil : sepolia,
          transport: http(),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === 'success') {
          setInputNumber("");
          refetchNumber();
        }
      } else {
        // For other wallets (MetaMask, Wepin), use wagmi
        await setNumber({
          address: counterAddress as `0x${string}`,
          abi: COUNTER_ABI,
          functionName: "setNumber",
          args: [BigInt(inputNumber)],
          chainId: targetChainId,
        });
        setInputNumber("");
      }
    } catch (error: any) {
      console.error("Error setting number:", error);
      alert(`Error sending transaction: ${error.message || "Please check your wallet and network."}`);
    }
  };

  const handlePrivyConnect = () => {
    if (!privyReady) return;
    privyLogin();
  };

  const handleDynamicConnect = () => {
    setShowAuthFlow(true);
  };

  const handleWepinConnect = async () => {
    try {
      // Login with Wepin SDK
      const userInfo = await loginWithWepin();
      if (userInfo) {
        setWepinAuthenticated(true);
        setWepinUser(userInfo);
        
        // Get accounts after login
        const accounts = await getWepinAccounts();
        setWepinAccounts(accounts);
        
        // Connect Wepin wallet connector if available
        const connector = connectors.find((c) => c.name === "Wepin");
        if (connector && accounts.length > 0) {
          connect({ connector });
        }
      }
    } catch (error) {
      console.error("Wepin login error:", error);
    }
  };

  const handleWepinDisconnect = async () => {
    try {
      await logoutWepin();
      setWepinAuthenticated(false);
      setWepinUser(null);
      setWepinAccounts([]);
      if (account.connector?.name === "Wepin") {
        disconnect();
      }
    } catch (error) {
      console.error("Wepin disconnect error:", error);
      // Even if logout fails, still reset the state
      setWepinAuthenticated(false);
      setWepinUser(null);
      setWepinAccounts([]);
    }
  };


  // Check if any wallet is connected (including Privy, Dynamic, and Wepin)
  const isAnyWalletConnected = account.isConnected || privyAuthenticated || dynamicAuthenticated || wepinAuthenticated;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Counter DApp</h1>

      {/* Network Selection Tabs */}
      <NetworkTabs 
        currentNetwork={selectedNetwork} 
        onNetworkChange={setSelectedNetwork} 
      />

      {/* Wallet Info Component - Shows connected wallet details and network status */}
      <WalletInfo 
        selectedNetwork={selectedNetwork}
        wepinAuthenticated={wepinAuthenticated}
        wepinUser={wepinUser}
        wepinAccounts={wepinAccounts}
        onOpenWepinWidget={openWepinWidget}
        onWepinDisconnect={handleWepinDisconnect}
      />

      {/* Show validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8d7da", borderRadius: "4px", border: "1px solid #f5c6cb" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#721c24" }}>Configuration Errors:</h3>
          {Object.entries(validationErrors).map(([provider, error]) => (
            <p key={provider} style={{ margin: "5px 0", color: "#721c24" }}>
              <strong>{provider}:</strong> {error}
            </p>
          ))}
        </div>
      )}
      
      {/* Wallet Connection - Only shown when not connected */}
      {!isAnyWalletConnected && (
        <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h2>Wallet Connection</h2>
          <p>
            <strong>Status:</strong> {account.status}
          </p>

          <div style={{ marginTop: "20px" }}>
            <h3>Connect with:</h3>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // First check if MetaMask is installed
                      if (!window.ethereum || !window.ethereum.isMetaMask) {
                        alert("MetaMask is not installed. Please install MetaMask extension.");
                        return;
                      }

                      // Wait a bit for MetaMask to be ready
                      await new Promise(resolve => setTimeout(resolve, 100));

                      const metamask = connectors.find((c) => c.name === "MetaMask");
                      if (metamask) {
                        console.log("Connecting to MetaMask...", metamask);
                        
                        // Check if provider is available
                        try {
                          const provider = await metamask.getProvider();
                          console.log("MetaMask provider:", provider);
                          
                          if (!provider) {
                            throw new Error("MetaMask provider not found");
                          }
                        } catch (providerError) {
                          console.error("Provider check error:", providerError);
                          
                          // Try to request accounts directly to wake up MetaMask
                          try {
                            await window.ethereum.request({ method: 'eth_requestAccounts' });
                            // Wait a bit after waking up MetaMask
                            await new Promise(resolve => setTimeout(resolve, 500));
                          } catch (e) {
                            console.error("Failed to wake up MetaMask:", e);
                          }
                        }
                        
                        // Now try to connect
                        await connect({ connector: metamask });
                      } else {
                        console.error("MetaMask connector not found");
                        alert("MetaMask connector not found. Please refresh the page and try again.");
                      }
                    } catch (error: any) {
                      console.error("MetaMask connection error:", error);
                      alert(`MetaMask connection error: ${error.message || error}`);
                    }
                  }}
                  disabled={!connectors.find((c) => c.name === "MetaMask")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f6851b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !connectors.find((c) => c.name === "MetaMask") ? "not-allowed" : "pointer",
                    opacity: !connectors.find((c) => c.name === "MetaMask") ? 0.5 : 1,
                  }}
                >
                  MetaMask
                </button>

                <button
                  type="button"
                  onClick={handlePrivyConnect}
                  disabled={!privyReady || !isValid("privy")}
                  title={validationErrors.privy}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: !isValid("privy") ? "#6c757d" : "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !isValid("privy") ? "not-allowed" : "pointer",
                  }}
                >
                  {!isValid("privy") ? "❌ " : ""}Privy
                </button>

                <button
                  type="button"
                  onClick={handleDynamicConnect}
                  disabled={!isValid("dynamic")}
                  title={validationErrors.dynamic}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: !isValid("dynamic") ? "#6c757d" : "#0052ff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !isValid("dynamic") ? "not-allowed" : "pointer",
                  }}
                >
                  {!isValid("dynamic") ? "❌ " : ""}Dynamic
                </button>

                <button
                  type="button"
                  onClick={handleWepinConnect}
                  disabled={!isValid("wepin")}
                  title={validationErrors.wepin}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: !isValid("wepin") ? "#6c757d" : "#00c3ff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !isValid("wepin") ? "not-allowed" : "pointer",
                  }}
                >
                  {!isValid("wepin") ? "❌ " : ""}Wepin
                </button>
            </div>

            {connectStatus === "pending" && <p style={{ marginTop: "10px" }}>Connecting...</p>}
            {connectError && <p style={{ marginTop: "10px", color: "red" }}>Error: {connectError.message}</p>}
          </div>
        </div>
      )}

      {isAnyWalletConnected && isCorrectNetwork && (
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h2>Counter Contract</h2>

          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Current Number:</strong> {currentNumber !== undefined ? currentNumber.toString() : "Loading..."}
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={isIncrementing || isIncrementConfirming}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isIncrementing || isIncrementConfirming ? "not-allowed" : "pointer",
                opacity: isIncrementing || isIncrementConfirming ? 0.7 : 1,
              }}
            >
              {isIncrementing ? "Sending..." : isIncrementConfirming ? "Confirming..." : "Increment"}
            </button>
          </div>

          <div>
            <input
              type="number"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              placeholder="Enter a number"
              style={{ padding: "8px", marginRight: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <button
              type="button"
              onClick={handleSetNumber}
              disabled={isSettingNumber || isSetNumberConfirming || !inputNumber}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSettingNumber || isSetNumberConfirming || !inputNumber ? "not-allowed" : "pointer",
                opacity: isSettingNumber || isSetNumberConfirming || !inputNumber ? 0.7 : 1,
              }}
            >
              {isSettingNumber ? "Sending..." : isSetNumberConfirming ? "Confirming..." : "Set Number"}
            </button>
          </div>
        </div>
      )}

      {!isAnyWalletConnected && (
        <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0", color: "#6c757d" }}>Please connect a wallet to interact with the Counter contract</p>
        </div>
      )}
    </div>
  );
}

export default App;