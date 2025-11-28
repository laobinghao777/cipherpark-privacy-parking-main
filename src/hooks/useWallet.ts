/**
 * Wallet Connection Hook
 * Handles MetaMask connection and Sepolia network switching
 */
import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { checkNetwork, switchToSepolia, SEPOLIA_CHAIN_ID } from '@/lib/contract';

interface WalletState {
  isConnected: boolean;
  address: string;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: '',
    isCorrectNetwork: false,
    isConnecting: false,
    error: null,
  });

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: '',
      }));
    } else {
      setState(prev => ({
        ...prev,
        isConnected: true,
        address: accounts[0],
      }));
    }
  };

  const handleChainChanged = async () => {
    // Reload to ensure clean state
    window.location.reload();
  };

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const address = await accounts[0].getAddress();
        const network = await provider.getNetwork();
        const isCorrectNetwork = network.chainId === BigInt(SEPOLIA_CHAIN_ID);

        setState(prev => ({
          ...prev,
          isConnected: true,
          address,
          isCorrectNetwork,
        }));
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'Please install MetaMask or a compatible wallet',
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Request account access
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check network
      let isCorrectNetwork = await checkNetwork();

      // If not on Sepolia, prompt to switch
      if (!isCorrectNetwork) {
        try {
          await switchToSepolia();
          isCorrectNetwork = true;
        } catch (switchError) {
          console.warn('Could not switch to Sepolia:', switchError);
        }
      }

      setState({
        isConnected: true,
        address: accounts[0],
        isCorrectNetwork,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: '',
      isCorrectNetwork: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToSepolia();
      setState(prev => ({ ...prev, isCorrectNetwork: true }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to switch network',
      }));
    }
  }, []);

  // Format address for display (0x1234...5678)
  const formattedAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : '';

  return {
    ...state,
    formattedAddress,
    connect,
    disconnect,
    switchNetwork,
    hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
  };
}
