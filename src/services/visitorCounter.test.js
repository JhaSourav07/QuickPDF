import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { incrementVisitorCount, subscribeToVisitorCount } from './visitorCounter';
import { getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'COUNTER_DOC_REF'),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn((n) => `increment(${n})`),
  onSnapshot: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({ db: {} }));

// ── incrementVisitorCount ─────────────────────────────────────────────────────

describe('incrementVisitorCount', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('creates the document with count:1 when it does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });
    setDoc.mockResolvedValueOnce();

    await incrementVisitorCount();

    expect(setDoc).toHaveBeenCalledWith('COUNTER_DOC_REF', { count: 1 });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('atomically increments by 1 when the document already exists', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true });
    updateDoc.mockResolvedValueOnce();

    await incrementVisitorCount();

    expect(updateDoc).toHaveBeenCalledWith('COUNTER_DOC_REF', {
      count: 'increment(1)',
    });
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('does not throw when Firestore fails — fails silently', async () => {
    getDoc.mockRejectedValueOnce(new Error('network error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(incrementVisitorCount()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[QuickPDF] Could not increment visitor count:'),
      expect.any(Error)
    );
  });
});

// ── subscribeToVisitorCount ───────────────────────────────────────────────────

describe('subscribeToVisitorCount', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('calls onUpdate with the count when the document exists', () => {
    const onUpdate = vi.fn();
    let snapshotCb;

    onSnapshot.mockImplementation((_ref, cb) => {
      snapshotCb = cb;
      return vi.fn(); // unsubscribe
    });

    subscribeToVisitorCount(onUpdate);

    // Simulate Firestore sending a snapshot
    snapshotCb({ exists: () => true, data: () => ({ count: 42 }) });

    expect(onUpdate).toHaveBeenCalledWith(42);
  });

  it('calls onUpdate with 0 when the document does not exist yet', () => {
    const onUpdate = vi.fn();
    let snapshotCb;

    onSnapshot.mockImplementation((_ref, cb) => {
      snapshotCb = cb;
      return vi.fn();
    });

    subscribeToVisitorCount(onUpdate);
    snapshotCb({ exists: () => false });

    expect(onUpdate).toHaveBeenCalledWith(0);
  });

  it('calls onUpdate with null when Firestore snapshot errors', () => {
    const onUpdate = vi.fn();
    let errorCb;

    onSnapshot.mockImplementation((_ref, _cb, errCb) => {
      errorCb = errCb;
      return vi.fn();
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    subscribeToVisitorCount(onUpdate);
    errorCb({ message: 'permission-denied' });

    expect(onUpdate).toHaveBeenCalledWith(null);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns an unsubscribe function', () => {
    const unsubscribeMock = vi.fn();
    onSnapshot.mockReturnValue(unsubscribeMock);

    const unsubscribe = subscribeToVisitorCount(vi.fn());
    unsubscribe();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('defaults count to 0 when document exists but count field is missing', () => {
    const onUpdate = vi.fn();
    let snapshotCb;

    onSnapshot.mockImplementation((_ref, cb) => {
      snapshotCb = cb;
      return vi.fn();
    });

    subscribeToVisitorCount(onUpdate);
    snapshotCb({ exists: () => true, data: () => ({}) }); // no count field

    expect(onUpdate).toHaveBeenCalledWith(0);
  });
});
