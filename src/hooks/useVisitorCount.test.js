import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVisitorCount } from './useVisitorCount';
import {
  incrementVisitorCount,
  subscribeToVisitorCount,
} from '../services/visitorCounter';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../services/visitorCounter', () => ({
  incrementVisitorCount: vi.fn(),
  subscribeToVisitorCount: vi.fn(),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useVisitorCount', () => {
  let unsubscribeMock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    unsubscribeMock = vi.fn();
    // Default: subscription never fires — keeps hook in loading state
    subscribeToVisitorCount.mockReturnValue(unsubscribeMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts in loading state with no count and no error', () => {
    const { result } = renderHook(() => useVisitorCount());

    expect(result.current.loading).toBe(true);
    expect(result.current.count).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('calls incrementVisitorCount exactly once on mount', () => {
    renderHook(() => useVisitorCount());
    expect(incrementVisitorCount).toHaveBeenCalledTimes(1);
  });

  it('sets count and clears loading when snapshot delivers a value', async () => {
    let snapshotCb;
    subscribeToVisitorCount.mockImplementation((cb) => {
      snapshotCb = cb;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useVisitorCount());

    act(() => { snapshotCb(99); });

    expect(result.current.count).toBe(99);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it('sets error and clears loading when snapshot delivers null (Firestore failure)', async () => {
    let snapshotCb;
    subscribeToVisitorCount.mockImplementation((cb) => {
      snapshotCb = cb;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useVisitorCount());

    act(() => { snapshotCb(null); });

    expect(result.current.error).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.count).toBeNull();
  });

  it('sets error after 5-second safety timeout when Firestore never responds', async () => {
    // Subscription never calls the callback
    subscribeToVisitorCount.mockReturnValue(unsubscribeMock);

    const { result } = renderHook(() => useVisitorCount());

    expect(result.current.loading).toBe(true);

    act(() => { vi.advanceTimersByTime(5000); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(true);
  });

  it('clears error when a subsequent real-time update arrives after an error', async () => {
    let snapshotCb;
    subscribeToVisitorCount.mockImplementation((cb) => {
      snapshotCb = cb;
      return unsubscribeMock;
    });

    const { result } = renderHook(() => useVisitorCount());

    // First: error state
    act(() => { snapshotCb(null); });
    expect(result.current.error).toBe(true);

    // Then: successful real-time update clears error
    act(() => { snapshotCb(150); });
    expect(result.current.error).toBe(false);
    expect(result.current.count).toBe(150);
  });

  it('unsubscribes from Firestore on unmount', () => {
    const { unmount } = renderHook(() => useVisitorCount());
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('does not double-increment when the hook re-renders', async () => {
    let snapshotCb;
    subscribeToVisitorCount.mockImplementation((cb) => {
      snapshotCb = cb;
      return unsubscribeMock;
    });

    const { rerender } = renderHook(() => useVisitorCount());
    act(() => { snapshotCb(1); });
    rerender();
    rerender();

    // increment must still be called exactly once
    expect(incrementVisitorCount).toHaveBeenCalledTimes(1);
  });
});
