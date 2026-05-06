import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';

const COUNTER_DOC = doc(db, 'stats', 'visitors');

/**
 * Atomically increments the visitor count by 1.
 * Creates the document if it doesn't exist yet.
 */
export async function incrementVisitorCount() {
  try {
    const snap = await getDoc(COUNTER_DOC);
    if (!snap.exists()) {
      await setDoc(COUNTER_DOC, { count: 1 });
    } else {
      await updateDoc(COUNTER_DOC, { count: increment(1) });
    }
  } catch (err) {
    // Silently fail — visitor counts should never break the UI
    console.warn('[QuickPDF] Could not increment visitor count:', err);
  }
}

/**
 * Subscribes to real-time visitor count updates.
 * @param {(count: number) => void} onUpdate - Called whenever the count changes.
 * @returns {() => void} Unsubscribe function.
 */
export function subscribeToVisitorCount(onUpdate) {
  return onSnapshot(
    COUNTER_DOC,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data().count ?? 0);
      } else {
        onUpdate(0);
      }
    },
    (err) => {
      console.warn('[QuickPDF] Visitor count snapshot error:', err.message);
      // Resolve loading even on failure so the UI never stays stuck
      onUpdate(null);
    }
  );
}
