/**
 * FHE SDK Integration for CipherPark
 * Based on FHEVM 0.9.1 + Relayer SDK 0.3.0-5
 */
import {
  createInstance,
  initSDK,
  SepoliaConfig as SDKSepoliaConfig,
} from '@zama-fhe/relayer-sdk/web';
import { getAddress, hexlify } from 'ethers';

// Use SDK's built-in Sepolia config (FHEVM 0.9.1)
const envRelayerUrl =
  typeof import.meta.env.VITE_RELAYER_URL === 'string'
    ? import.meta.env.VITE_RELAYER_URL.trim()
    : '';
const resolvedRelayerUrl =
  envRelayerUrl || SDKSepoliaConfig.relayerUrl;

export const SepoliaConfig = {
  ...SDKSepoliaConfig,
  relayerUrl: resolvedRelayerUrl,
};

// FHE Instance type
export type FheInstance = Awaited<ReturnType<typeof createInstance>>;

// Singleton instance
let fheInstance: FheInstance | null = null;
let initPromise: Promise<FheInstance> | null = null;
let isSDKInitialized = false;

/**
 * Initialize FHE SDK and create instance
 * Uses singleton pattern to avoid multiple initializations
 */
export async function initializeFHE(): Promise<FheInstance> {
  // Return existing instance
  if (fheInstance) return fheInstance;

  // Return pending initialization
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Initialize WASM module (only once)
      if (!isSDKInitialized) {
        console.log('[FHE] Initializing SDK...');
        await initSDK();
        isSDKInitialized = true;
        console.log('[FHE] SDK initialized');
      }

      // Create instance with Sepolia config
      console.log('[FHE] Creating instance...');
      const instance = await createInstance(SepoliaConfig);
      fheInstance = instance;
      console.log('[FHE] Instance created successfully');

      return instance;
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get current FHE instance (throws if not initialized)
 */
export function getFHEInstance(): FheInstance {
  if (!fheInstance) {
    throw new Error('FHE not initialized. Call initializeFHE() first.');
  }
  return fheInstance;
}

/**
 * Check if FHE is initialized
 */
export function isFHEInitialized(): boolean {
  return fheInstance !== null;
}

/**
 * Encrypt a single uint64 value for a contract
 * @param value - The value to encrypt (as number or bigint)
 * @param contractAddress - The target contract address
 * @param userAddress - The user's wallet address
 * @returns Object containing handle and inputProof
 */
export async function encryptUint64(
  value: number | bigint,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; inputProof: string }> {
  const fhe = await initializeFHE();

  // Ensure checksum address format
  const contractAddr = getAddress(contractAddress) as `0x${string}`;

  // Create encrypted input
  const input = fhe.createEncryptedInput(contractAddr, userAddress);

  // Add uint64 value
  input.add64(BigInt(value));

  // Encrypt and get handles + proof
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    inputProof: hexlify(inputProof)
  };
}

/**
 * Encrypt parking minutes for the quote function
 * @param minutes - Total parking minutes
 * @param contractAddress - ParkingFeeCalculator contract address
 * @param userAddress - User's wallet address
 */
export async function encryptParkingMinutes(
  minutes: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; inputProof: string }> {
  if (minutes <= 0) {
    throw new Error('Minutes must be greater than 0');
  }

  console.log(`[FHE] Encrypting ${minutes} minutes...`);
  const result = await encryptUint64(minutes, contractAddress, userAddress);
  console.log('[FHE] Encryption complete');

  return result;
}
