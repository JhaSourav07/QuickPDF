import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccount } from 'wagmi';
import { getDoc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { useSubscription } from './useSubscription';

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  increment: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

describe('useSubscription', () => {
  let storage = {};

  beforeEach(() => {
    vi.clearAllMocks();
    storage = {};
    
    const mockStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => {
        storage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
    
    localStorage.clear();
    useAccount.mockReturnValue({ address: undefined, isConnected: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with local usage when disconnected', async () => {
    localStorage.setItem('quickpdf_usage', '5');
    const { result } = renderHook(() => useSubscription());

    // queueMicrotask is used in the hook for fallback initialization
    await waitFor(() => {
      expect(result.current.usageCount).toBe(5);
    });
    
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isWalletConnected).toBe(false);
  });

  it('increments local usage when disconnected', async () => {
    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.incrementUsage();
    });

    expect(result.current.usageCount).toBe(1);
    expect(localStorage.getItem('quickpdf_usage')).toBe('1');
  });

  it('syncs with firebase when wallet connects', async () => {
    useAccount.mockReturnValue({ address: '0x123', isConnected: true });
    
    // Mock user doesn't exist initially
    getDoc.mockResolvedValueOnce({ exists: () => false });
    setDoc.mockResolvedValueOnce();
    
    // Mock snapshot listener
    let snapshotCallback;
    onSnapshot.mockImplementation((ref, cb) => {
      snapshotCallback = cb;
      return vi.fn(); // return unsubscribe func
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
    });

    // Simulate firebase sending snapshot
    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({ usageCount: 10, isPremium: true })
      });
    });

    expect(result.current.usageCount).toBe(10);
    expect(result.current.isPremium).toBe(true);
  });

  it('increments usage via firebase when connected', async () => {
    useAccount.mockReturnValue({ address: '0x123', isConnected: true });
    getDoc.mockResolvedValueOnce({ exists: () => true });
    onSnapshot.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.incrementUsage();
    });

    expect(updateDoc).toHaveBeenCalled();
    expect(increment).toHaveBeenCalledWith(1);
  });

  it('blocks increment if user is premium', async () => {
    useAccount.mockReturnValue({ address: '0x123', isConnected: true });
    getDoc.mockResolvedValueOnce({ exists: () => true });
    
    let snapshotCallback;
    onSnapshot.mockImplementation((ref, cb) => {
      snapshotCallback = cb;
      return vi.fn();
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(onSnapshot).toHaveBeenCalled());

    act(() => {
      snapshotCallback({
        exists: () => true,
        data: () => ({ usageCount: 10, isPremium: true })
      });
    });

    await act(async () => {
      await result.current.incrementUsage();
    });

    // Should not call updateDoc since premium
    expect(updateDoc).not.toHaveBeenCalled();
  });
});
