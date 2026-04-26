import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useCryptoPrices } from './useCryptoPrices';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('useCryptoPrices', () => {
  it('formats fallback prices correctly', () => {
    // Simulate what the hook does when it falls back to initialData
    useQuery.mockReturnValue({
      data: {
        ethUsd: 3200,
        maticUsd: 0.90,
        bnbUsd: 600,
        avaxUsd: 35,
      },
      isError: false,
      error: null,
    });
    
    const { result } = renderHook(() => useCryptoPrices(5));
    
    // 5 / 3200 = 0.0015625 -> fixed to 6 places -> 0.001563
    expect(result.current.eth.amount).toBe('0.001563');
    
    // 5 / 0.90 = 5.5555...
    expect(result.current.matic.amount).toBe('5.5556');
    
    // Stablecoins are exactly targetUsd
    expect(result.current.usdc.amount).toBe('5.00');
    expect(result.current.usdt.amount).toBe('5.00');
  });

  it('updates formatting when live prices are returned', () => {
    useQuery.mockReturnValue({
      data: {
        ethUsd: 4000,
        maticUsd: 1,
        bnbUsd: 500,
        avaxUsd: 50,
      },
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useCryptoPrices(10));

    // 10 / 4000 = 0.002500
    expect(result.current.eth.amount).toBe('0.002500');
    expect(result.current.matic.amount).toBe('10.0000');
    expect(result.current.bnb.amount).toBe('0.02000');
    expect(result.current.avax.amount).toBe('0.2000');
  });

  it('handles error states and missing data gracefully', () => {
    useQuery.mockReturnValue({
      data: undefined, // Data might be undefined if query fails before initialData resolves (hypothetical)
      isError: true,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useCryptoPrices(5));

    expect(result.current.isError).toBe(true);
    
    // If data is undefined, the hook maps the token objects to undefined
    expect(result.current.eth).toBeUndefined();
    expect(result.current.matic).toBeUndefined();
    expect(result.current.bnb).toBeUndefined();
    expect(result.current.avax).toBeUndefined();
    
    // Stablecoins should still work because they don't depend on API data
    expect(result.current.usdc.amount).toBe('5.00');
  });
});
