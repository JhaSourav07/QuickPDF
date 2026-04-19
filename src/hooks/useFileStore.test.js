import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useFileStore } from './useFileStore';

describe('useFileStore', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with the default value if DB is empty', async () => {
    const { result } = renderHook(() => useFileStore('test_key', []));
    
    // Initial render
    expect(result.current[0]).toEqual([]);

    // Wait for DB to settle
    await waitFor(() => {
      expect(result.current[0]).toEqual([]);
    });
  });

  it('updates state when set is called', async () => {
    const { result } = renderHook(() => useFileStore('test_key_2', null));

    act(() => {
      result.current[1]({ name: 'test.pdf' });
    });

    expect(result.current[0]).toEqual({ name: 'test.pdf' });
  });

  it('revokes blob URLs when clear is called', async () => {
    const { result } = renderHook(() => useFileStore('test_key_3', null));

    act(() => {
      result.current[1]([{ url: 'blob:test', file: new Blob() }]);
    });

    expect(result.current[0].length).toBe(1);

    act(() => {
      result.current[2](); // call clear()
    });

    expect(result.current[0]).toBe(null);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
