import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { FREE_LIMITS } from "../config/limits";

const LS_KEY = "quickpdf_usage";
const USERS  = "users";

function getLocalUsage() {
  const n = parseInt(localStorage.getItem(LS_KEY), 10);
  return isNaN(n) ? 0 : n;
}

function setLocalUsage(n) {
  localStorage.setItem(LS_KEY, String(n));
}

export function useSubscription() {
  const { address, isConnected } = useAccount();
  const [isPremium,  setIsPremium]  = useState(false);
  const [usageCount, setUsageCount] = useState(getLocalUsage);

  useEffect(() => {
    if (!isConnected || !address) {
      queueMicrotask(() => {
        setUsageCount(getLocalUsage());
        setIsPremium(false);
      });
      return;
    }

    const userRef = doc(db, USERS, address.toLowerCase());
    let unsubscribe = () => {};

    // Chain getDoc → setDoc → onSnapshot so the doc always exists before we listen.
    // Without this, a brand-new user's onSnapshot fires on an empty doc and we lose their data.
    getDoc(userRef)
      .then((snap) => {
        if (!snap.exists()) {
          return setDoc(userRef, {
            walletAddress: address.toLowerCase(),
            usageCount:    getLocalUsage(),
            isPremium:     false,
            createdAt:     serverTimestamp(),
          });
        }
      })
      .then(() => {
        unsubscribe = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setUsageCount(d.usageCount ?? 0);
            setIsPremium(d.isPremium   ?? false);
          }
        });
      })
      .catch((err) => console.error("[useSubscription]", err));

    return () => unsubscribe();
  }, [address, isConnected]);

  const hasReachedGlobalLimit = !isPremium && usageCount >= FREE_LIMITS.globalRequests;

  const incrementUsage = useCallback(async () => {
    if (isPremium) return;
    if (isConnected && address) {
      await updateDoc(doc(db, USERS, address.toLowerCase()), { usageCount: increment(1) });
    } else {
      const next = getLocalUsage() + 1;
      setLocalUsage(next);
      setUsageCount(next);
    }
  }, [isPremium, isConnected, address]);

  return {
    isPremium,
    isWalletConnected: isConnected,
    walletAddress:     address,
    usageCount,
    hasReachedGlobalLimit,
    incrementUsage,
  };
}
