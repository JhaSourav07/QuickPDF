import { useState, useEffect, useRef } from 'react';
import {
  incrementVisitorCount,
  subscribeToVisitorCount,
} from '../services/visitorCounter';

/**
 * Increments the visitor count exactly once per page load and
 * returns the live count read from Firestore in real-time.
 *
 * @returns {{ count: number | null, loading: boolean, error: boolean }}
 */
export function useVisitorCount() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const incremented = useRef(false);

  useEffect(() => {
    // Increment only once, even under React Strict Mode double-invoke
    if (!incremented.current) {
      incremented.current = true;
      incrementVisitorCount();
    }

    // Safety net: never leave the UI stuck at "loading" for more than 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
      setError(true);
    }, 5000);

    // Subscribe to live updates
    const unsubscribe = subscribeToVisitorCount((newCount) => {
      clearTimeout(timeout);
      if (newCount === null) {
        // Firestore read failed (likely security rules not yet configured)
        setError(true);
      } else {
        setCount(newCount);
        setError(false);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return { count, loading, error };
}

