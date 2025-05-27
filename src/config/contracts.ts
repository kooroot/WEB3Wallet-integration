export const COUNTER_ABI = [
  {
    inputs: [],
    name: "increment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "number",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newNumber", type: "uint256" }],
    name: "setNumber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const CONTRACT_ADDRESSES = {
  // Anvil (Local)
  31337: {
    counter: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  // Sepolia
  11155111: {
    counter: "0x594740950525cD4DD311BbBb73EE079CDC01205b",
  },
} as const;

export const getContractAddress = (chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[31337]) => {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`No contract addresses found for chain ${chainId}`);
  }
  return addresses[contractName];
};