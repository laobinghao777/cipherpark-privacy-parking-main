/**
 * Smart Contract Configuration and ABI
 * ParkingFeeCalculator on Sepolia Testnet
 */
import { Contract, BrowserProvider, Signer, formatUnits } from 'ethers';

// Contract ABI - ParkingFeeCalculator
export const PARKING_FEE_CALCULATOR_ABI = [
  // Constructor (for reference)
  "constructor(uint64 pricePerBlock_, uint16 maxBlocks_)",

  // View functions
  "function version() external view returns (string memory)",
  "function owner() external view returns (address)",
  "function pricePerBlock() external view returns (uint64)",
  "function maxBlocks() external view returns (uint16)",
  "function BLOCK_MINUTES() external view returns (uint64)",
  "function getMyFeeHandle() external view returns (bytes32)",

  // Owner functions
  "function setPricePerBlock(uint64 newPrice) external",
  "function setMaxBlocks(uint16 newMax) external",
  "function transferOwnership(address n) external",

  // Main quote function
  "function quote(bytes32 minutesExt, bytes calldata proof) external returns (bytes32 feeHandle)",

  // Events
  "event Quoted(address indexed user, bytes32 feeHandle)"
] as const;

// Contract address - set via environment variable or use default
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Sepolia chain ID
export const SEPOLIA_CHAIN_ID = 11155111;

// Get provider from window.ethereum
export async function getProvider(): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error('MetaMask or compatible wallet not found');
  }
  return new BrowserProvider(window.ethereum);
}

// Get signer from provider
export async function getSigner(): Promise<Signer> {
  const provider = await getProvider();
  return provider.getSigner();
}

// Get contract instance
export function getContract(signerOrProvider: Signer | BrowserProvider): Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env');
  }
  return new Contract(CONTRACT_ADDRESS, PARKING_FEE_CALCULATOR_ABI, signerOrProvider);
}

// Check if connected to Sepolia
export async function checkNetwork(): Promise<boolean> {
  const provider = await getProvider();
  const network = await provider.getNetwork();
  return network.chainId === BigInt(SEPOLIA_CHAIN_ID);
}

// Switch to Sepolia network
export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
  } catch (error: any) {
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    } else {
      throw error;
    }
  }
}

// Contract read functions
export async function getContractVersion(): Promise<string> {
  const provider = await getProvider();
  const contract = getContract(provider);
  return contract.version();
}

export async function getContractOwner(): Promise<string> {
  const provider = await getProvider();
  const contract = getContract(provider);
  return contract.owner();
}

export async function getPricePerBlock(): Promise<bigint> {
  const provider = await getProvider();
  const contract = getContract(provider);
  return contract.pricePerBlock();
}

export async function getMaxBlocks(): Promise<number> {
  const provider = await getProvider();
  const contract = getContract(provider);
  const result = await contract.maxBlocks();
  return Number(result);
}

export async function getBlockMinutes(): Promise<number> {
  const provider = await getProvider();
  const contract = getContract(provider);
  const result = await contract.BLOCK_MINUTES();
  return Number(result);
}

export async function getMyFeeHandle(): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);
  return contract.getMyFeeHandle();
}

// Contract write functions

/**
 * Call quote function with encrypted minutes
 * @param encryptedMinutes - The encrypted minutes handle (bytes32)
 * @param inputProof - The proof from FHE encryption
 * @returns Transaction receipt and fee handle
 */
export async function callQuote(
  encryptedMinutes: string,
  inputProof: string
): Promise<{ txHash: string; feeHandle: string }> {
  const signer = await getSigner();
  const contract = getContract(signer);

  console.log('[Contract] Calling quote...');
  const tx = await contract.quote(encryptedMinutes, inputProof);
  console.log('[Contract] Transaction sent:', tx.hash);

  const receipt = await tx.wait();
  console.log('[Contract] Transaction confirmed');

  // Parse Quoted event to get fee handle
  const quotedEvent = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === 'Quoted';
    } catch {
      return false;
    }
  });

  let feeHandle = '';
  if (quotedEvent) {
    const parsed = contract.interface.parseLog(quotedEvent);
    feeHandle = parsed?.args.feeHandle || '';
  }

  // If event not found, get handle from contract
  if (!feeHandle) {
    feeHandle = await getMyFeeHandle();
  }

  return { txHash: tx.hash, feeHandle };
}

// Owner functions

export async function setPricePerBlock(newPrice: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);

  const tx = await contract.setPricePerBlock(BigInt(newPrice));
  await tx.wait();

  return tx.hash;
}

export async function setMaxBlocks(newMax: number): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);

  const tx = await contract.setMaxBlocks(newMax);
  await tx.wait();

  return tx.hash;
}

export async function transferOwnership(newOwner: string): Promise<string> {
  const signer = await getSigner();
  const contract = getContract(signer);

  const tx = await contract.transferOwnership(newOwner);
  await tx.wait();

  return tx.hash;
}

// Format price (cents to dollars)
export function formatPrice(cents: bigint | number): string {
  const centsNum = typeof cents === 'bigint' ? Number(cents) : cents;
  return `$${(centsNum / 100).toFixed(2)}`;
}

// Declare ethereum on window
declare global {
  interface Window {
    ethereum?: any;
  }
}
