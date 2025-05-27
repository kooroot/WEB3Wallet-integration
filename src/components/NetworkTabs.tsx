import { useState } from 'react';
import { anvil, sepolia } from 'wagmi/chains';

interface NetworkTabsProps {
  currentNetwork: 'anvil' | 'sepolia';
  onNetworkChange: (network: 'anvil' | 'sepolia') => void;
}

export function NetworkTabs({ currentNetwork, onNetworkChange }: NetworkTabsProps) {
  const networks = [
    { id: 'anvil', name: 'Anvil (Local)', chainId: anvil.id, color: '#f39c12' },
    { id: 'sepolia', name: 'Ethereum Sepolia', chainId: sepolia.id, color: '#627eea' }
  ] as const;

  return (
    <div style={{ 
      marginBottom: '30px',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h2>Network Selection</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginTop: '15px'
      }}>
        {networks.map((network) => (
          <button
            key={network.id}
            onClick={() => onNetworkChange(network.id as 'anvil' | 'sepolia')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentNetwork === network.id ? network.color : '#e9ecef',
              color: currentNetwork === network.id ? 'white' : '#333',
              border: `2px solid ${currentNetwork === network.id ? network.color : '#ddd'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentNetwork === network.id ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {network.name}
            <div style={{ 
              fontSize: '12px', 
              marginTop: '2px',
              opacity: 0.8
            }}>
              Chain ID: {network.chainId}
            </div>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <strong>Selected Network:</strong> {currentNetwork === 'anvil' ? 'Anvil (Local Development)' : 'Ethereum Sepolia (Testnet)'}
      </div>
    </div>
  );
}