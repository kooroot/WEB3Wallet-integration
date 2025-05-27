import { useAccount, useDisconnect, useEnsName, useBalance, useSwitchChain } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useDynamicContext, useDynamicEvents } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import { anvil, sepolia } from '../wagmi';

interface WalletInfoProps {
  selectedNetwork?: 'anvil' | 'sepolia';
  wepinAuthenticated?: boolean;
  wepinUser?: any;
  wepinAccounts?: any[];
  onOpenWepinWidget?: () => void;
  onWepinDisconnect?: () => void;
}

export function WalletInfo({ 
  selectedNetwork = 'anvil',
  wepinAuthenticated = false,
  wepinUser,
  wepinAccounts = [],
  onOpenWepinWidget,
  onWepinDisconnect
}: WalletInfoProps) {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const { chains, switchChain } = useSwitchChain();
  
  // Privy
  const { authenticated, user, logout: privyLogout } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  
  // Dynamic
  const { user: dynamicUser, handleLogOut: dynamicLogout, primaryWallet } = useDynamicContext();
  
  const [currentChainId, setCurrentChainId] = useState<number | undefined>();
  const [walletType, setWalletType] = useState<string>('');


  // Determine wallet type and current chain ID
  useEffect(() => {
    const updateChainInfo = async () => {
      // Wepin
      if (connector?.name === "Wepin") {
        setWalletType("wepin");
        setCurrentChainId(chainId);
      }
      // Privy
      else if (authenticated && privyWallets.length > 0) {
        setWalletType("privy");
        try {
          const wallet = privyWallets[0];
          const provider = await wallet.getEthereumProvider();
          if (provider) {
            const chainIdHex = await provider.request({ method: 'eth_chainId' });
            const chainIdNumber = parseInt(chainIdHex as string, 16);
            setCurrentChainId(chainIdNumber);
          }
        } catch (error) {
          console.error('Error getting Privy chain ID:', error);
          setCurrentChainId(chainId);
        }
      }
      // Dynamic
      else if (dynamicUser && primaryWallet) {
        setWalletType("dynamic");
        try {
          // Import isEthereumWallet at the top if needed
          const { isEthereumWallet } = await import('@dynamic-labs/ethereum');
          if (isEthereumWallet(primaryWallet)) {
            // Get the wallet client from Dynamic
            const walletClient = await primaryWallet.getWalletClient();
            if (walletClient && walletClient.chain) {
              setCurrentChainId(walletClient.chain.id);
            } else {
              // Fallback: try to get from public client
              const publicClient = await primaryWallet.getPublicClient();
              if (publicClient) {
                const chainId = await publicClient.getChainId();
                setCurrentChainId(chainId);
              }
            }
          }
        } catch (error) {
          console.error('Error getting Dynamic chain ID:', error);
          setCurrentChainId(chainId);
        }
      }
      // MetaMask
      else if (connector?.name === "MetaMask" && !dynamicUser) {
        setWalletType("metamask");
        setCurrentChainId(chainId);
      }
      // Default
      else {
        setWalletType("unknown");
        setCurrentChainId(chainId);
      }
    };

    updateChainInfo();
  }, [connector, chainId, authenticated, privyWallets, dynamicUser, primaryWallet]);

  // Listen for Dynamic network changes
  useDynamicEvents('primaryWalletNetworkChanged', () => {
    if (walletType === "dynamic" && primaryWallet) {
      // Re-run updateChainInfo when network changes
      const updateDynamicChain = async () => {
        try {
          const { isEthereumWallet } = await import('@dynamic-labs/ethereum');
          if (isEthereumWallet(primaryWallet)) {
            const walletClient = await primaryWallet.getWalletClient();
            if (walletClient && walletClient.chain) {
              setCurrentChainId(walletClient.chain.id);
            }
          }
        } catch (error) {
          console.error('Error updating Dynamic chain ID:', error);
        }
      };
      updateDynamicChain();
    }
  });

  const handleDisconnect = async () => {
    if (walletType === 'privy') {
      await privyLogout();
    } else if (walletType === 'dynamic') {
      await dynamicLogout();
    } else if (walletType === 'wepin' && onWepinDisconnect) {
      await onWepinDisconnect();
    } else {
      disconnect();
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      if (walletType === "privy" && privyWallets.length > 0) {
        const wallet = privyWallets[0];
        const provider = await wallet.getEthereumProvider();
        
        // Privy 지갑은 provider를 통해 직접 네트워크 전환
        if (provider) {
          try {
            // 먼저 네트워크 전환 시도
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${targetChainId.toString(16)}` }],
            });
          } catch (switchError: any) {
            // 네트워크가 없으면 추가
            if (switchError.code === 4902) {
              const chainInfo = targetChainId === sepolia.id ? {
                chainId: `0x${sepolia.id.toString(16)}`,
                chainName: sepolia.name,
                nativeCurrency: sepolia.nativeCurrency,
                rpcUrls: sepolia.rpcUrls.default.http,
                blockExplorerUrls: sepolia.blockExplorers?.default.url ? [sepolia.blockExplorers.default.url] : [],
              } : {
                chainId: `0x${anvil.id.toString(16)}`,
                chainName: anvil.name,
                nativeCurrency: anvil.nativeCurrency,
                rpcUrls: anvil.rpcUrls.default.http,
              };
              
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [chainInfo],
              });
            } else {
              throw switchError;
            }
          }
          
          // Update chain ID immediately after switch
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          const chainIdNumber = parseInt(chainIdHex as string, 16);
          setCurrentChainId(chainIdNumber);
        }
      } else if (walletType === "dynamic" && primaryWallet) {
        const { isEthereumWallet } = await import('@dynamic-labs/ethereum');
        if (isEthereumWallet(primaryWallet)) {
          const connector = primaryWallet.connector;
          if (connector && connector.switchNetwork) {
            await connector.switchNetwork({ networkChainId: targetChainId });
            // Update chain ID immediately after switch
            const walletClient = await primaryWallet.getWalletClient();
            if (walletClient && walletClient.chain) {
              setCurrentChainId(walletClient.chain.id);
            }
          }
        }
      } else {
        await switchChain({ chainId: targetChainId });
      }
    } catch (error: any) {
      console.error("Error switching network:", error);
      if (error?.code === 4902) {
        alert(`${targetNetworkName} network not found. Please add it manually to your wallet.`);
      } else {
        alert("Failed to switch network. Please switch manually in your wallet.");
      }
    }
  };

  if (!isConnected && !authenticated && !dynamicUser && !wepinAuthenticated) {
    return null;
  }

  // Get network name
  const getNetworkName = (chainId: number | undefined) => {
    if (!chainId) return "Unknown";
    // Check known networks first
    if (chainId === anvil.id) return anvil.name;
    if (chainId === sepolia.id) return sepolia.name;
    // Fallback to chains array
    const chain = chains.find((c) => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  const targetChainId = selectedNetwork === 'anvil' ? anvil.id : sepolia.id;
  const targetNetworkName = selectedNetwork === 'anvil' ? 'Anvil' : 'Sepolia';
  const isCorrectNetwork = currentChainId === targetChainId;
  const isWepinConnected = walletType === "wepin";

  // Format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get display address
  const displayAddress = address || user?.wallet?.address || primaryWallet?.address;

  return (
    <div style={{ 
      marginBottom: '30px', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px'
    }}>
      <h2>Wallet Information</h2>
      
      {/* Connection Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> <span style={{ color: 'green' }}>Connected</span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Wallet Type:</strong> {walletType.charAt(0).toUpperCase() + walletType.slice(1)}
        </div>
        {displayAddress && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Address:</strong> {formatAddress(displayAddress)}
          </div>
        )}
      </div>

      {/* Network Information */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Network:</strong>{' '}
          <span style={{ color: isCorrectNetwork ? 'green' : 'red' }}>
            {getNetworkName(currentChainId)} ({currentChainId || 'Unknown'})
          </span>
        </div>
        
        {!isCorrectNetwork && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>⚠️ Wrong Network</p>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>
              {isWepinConnected 
                ? `Wepin does not support ${selectedNetwork === 'anvil' ? 'custom networks' : 'testnet switching'}. Please use another wallet.`
                : `Please switch to ${targetNetworkName} network (Chain ID: ${targetChainId}) to interact with the Counter contract.`}
            </p>
            {!isWepinConnected && (
              <button
                type="button"
                onClick={handleSwitchNetwork}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Switch to {targetNetworkName} Network
              </button>
            )}
          </div>
        )}
      </div>

      {/* Additional Wallet Info */}
      <div style={{ marginBottom: '15px' }}>
        {ensName && (
          <div style={{ marginBottom: '10px' }}>
            <strong>ENS Name:</strong> {ensName}
          </div>
        )}
        {balance && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Balance:</strong> {balance.formatted} {balance.symbol}
          </div>
        )}
      </div>

      {/* Privy Specific Info */}
      {authenticated && user && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Privy User ID:</strong> {user.id}
          </div>
          {user.email && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {user.email.address}
            </div>
          )}
          {user.phone && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Phone:</strong> {user.phone.number}
            </div>
          )}
          {user.twitter && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Twitter:</strong> @{user.twitter.username}
            </div>
          )}
          {user.wallet && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Privy Wallet:</strong> {user.wallet.address}
            </div>
          )}
        </>
      )}

      {/* Dynamic Specific Info */}
      {dynamicUser && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Dynamic User ID:</strong> {dynamicUser.userId}
          </div>
          {dynamicUser.email && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {dynamicUser.email}
            </div>
          )}
          {primaryWallet && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <strong>Wallet Address:</strong> {primaryWallet.address}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Wallet Type:</strong> {primaryWallet.connector?.name || 'Unknown'}
              </div>
            </>
          )}
          {dynamicUser.alias && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Alias:</strong> {dynamicUser.alias}
            </div>
          )}
        </>
      )}

      {/* Wepin Specific Info */}
      {wepinAuthenticated && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Wepin User:</strong> {wepinUser?.email || 'Unknown'}
          </div>
          {wepinAccounts.length > 0 && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <strong>Wepin Accounts:</strong>
              </div>
              {wepinAccounts.map((acc, index) => (
                <div key={index} style={{ marginLeft: '20px', marginBottom: '5px', fontSize: '14px' }}>
                  {acc.network}: {formatAddress(acc.address)}
                </div>
              ))}
              {onOpenWepinWidget && (
                <button
                  type="button"
                  onClick={onOpenWepinWidget}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#00c3ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Open Wepin Widget
                </button>
              )}
            </>
          )}
        </>
      )}

      <button 
        onClick={handleDisconnect}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Disconnect
      </button>
    </div>
  );
}