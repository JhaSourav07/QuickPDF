import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckout, CHECKOUT_STAGE } from './useCheckout';
import { useAccount, useChainId, useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { updateDoc } from 'firebase/firestore';

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSendTransaction: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAccount.mockReturnValue({ address: '0x123', isConnected: true });
    useChainId.mockReturnValue(1);
    useSendTransaction.mockReturnValue({ sendTransaction: vi.fn(), reset: vi.fn() });
    useWriteContract.mockReturnValue({ writeContract: vi.fn(), reset: vi.fn() });
    useWaitForTransactionReceipt.mockReturnValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes in IDLE stage', () => {
    const { result } = renderHook(() => useCheckout());
    expect(result.current.stage).toBe(CHECKOUT_STAGE.IDLE);
  });

  it('executes native payment and updates stage to SIGNING', () => {
    const mockSendTx = vi.fn();
    useSendTransaction.mockReturnValue({ sendTransaction: mockSendTx, reset: vi.fn() });
    
    const { result } = renderHook(() => useCheckout());

    act(() => {
      result.current.executePayment('ETH', '100000000000000000');
    });

    expect(result.current.stage).toBe(CHECKOUT_STAGE.SIGNING);
    expect(mockSendTx).toHaveBeenCalledWith(expect.objectContaining({ value: '100000000000000000' }));
  });

  it('transitions to CONFIRMING when transaction hash is available', async () => {
    useSendTransaction.mockReturnValue({ data: '0xtxhash', reset: vi.fn() });
    useWaitForTransactionReceipt.mockReturnValue({});

    const { result } = renderHook(() => useCheckout());

    // queueMicrotask is used, so we waitFor it to flush
    await waitFor(() => {
      expect(result.current.stage).toBe(CHECKOUT_STAGE.CONFIRMING);
      expect(result.current.txHash).toBe('0xtxhash');
    });
  });

  it('transitions to WRITING_DB and SUCCESS when transaction is confirmed', async () => {
    useSendTransaction.mockReturnValue({ data: '0xtxhash', reset: vi.fn() });
    useWaitForTransactionReceipt.mockReturnValue({ isSuccess: true });
    updateDoc.mockResolvedValueOnce();

    const { result } = renderHook(() => useCheckout());

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(result.current.stage).toBe(CHECKOUT_STAGE.SUCCESS);
    });
  });

  it('handles user rejected request silently', async () => {
    const rejectError = new Error('User rejected');
    rejectError.name = 'UserRejectedRequestError';
    useSendTransaction.mockReturnValue({ error: rejectError, reset: vi.fn() });
    useWaitForTransactionReceipt.mockReturnValue({});

    const { result } = renderHook(() => useCheckout());

    await waitFor(() => {
      expect(result.current.stage).toBe(CHECKOUT_STAGE.IDLE);
    });
  });
});
