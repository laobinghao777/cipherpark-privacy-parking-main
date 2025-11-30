/**
 * FHE Hook for React Components
 * Handles FHE initialization and encryption operations
 */
import { useState, useCallback, useEffect } from 'react';
import {
  initializeFHE,
  isFHEInitialized,
  encryptParkingMinutes,
  type FheInstance,
} from '@/lib/fhe';
import { CONTRACT_ADDRESS, callQuote } from '@/lib/contract';

interface FHEState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

export function useFHE() {
  const [state, setState] = useState<FHEState>({
    isInitialized: isFHEInitialized(),
    isInitializing: false,
    error: null,
  });

  // Initialize FHE on demand
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) return;

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      await initializeFHE();
      setState({
        isInitialized: true,
        isInitializing: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[useFHE] Initialization error:', error);
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error.message || 'Failed to initialize FHE',
      }));
    }
  }, [state.isInitialized, state.isInitializing]);

  return {
    ...state,
    initialize,
  };
}

interface CalculateFeeResult {
  feeHandle: string;
  txHash: string;
}

interface UseCalculateFeeState {
  isCalculating: boolean;
  error: string | null;
  result: CalculateFeeResult | null;
}

/**
 * Hook for calculating parking fee with FHE
 */
export function useCalculateFee() {
  const [state, setState] = useState<UseCalculateFeeState>({
    isCalculating: false,
    error: null,
    result: null,
  });

  const calculateFee = useCallback(async (
    minutes: number,
    userAddress: string
  ): Promise<CalculateFeeResult | null> => {
    if (!CONTRACT_ADDRESS) {
      setState(prev => ({
        ...prev,
        error: 'Contract address not configured',
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isCalculating: true,
      error: null,
      result: null,
    }));

    try {
      // Step 1: Initialize FHE if needed
      await initializeFHE();

      // Step 2: Encrypt parking minutes
      console.log('[useCalculateFee] Encrypting minutes:', minutes);
      const { handle, inputProof } = await encryptParkingMinutes(
        minutes,
        CONTRACT_ADDRESS,
        userAddress
      );

      // Step 3: Call smart contract
      console.log('[useCalculateFee] Calling contract...');
      const { txHash, feeHandle } = await callQuote(handle, inputProof);

      const result: CalculateFeeResult = {
        feeHandle,
        txHash,
      };

      setState({
        isCalculating: false,
        error: null,
        result,
      });

      return result;
    } catch (error: any) {
      console.error('[useCalculateFee] Error:', error);
      setState({
        isCalculating: false,
        error: error.message || 'Failed to calculate fee',
        result: null,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isCalculating: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    calculateFee,
    reset,
  };
}
