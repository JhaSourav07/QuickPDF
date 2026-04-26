import { useState, useEffect, useCallback } from "react";
import { useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TREASURY_ADDRESS, ERC20_TRANSFER_ABI, getUsdcAddress, getUsdtAddress } from "../config/contracts";

const USERS = "users";

// Payment lifecycle stages — drives the UI in PaywallModal
export const CHECKOUT_STAGE = {
  IDLE:       "IDLE",
  SIGNING:    "SIGNING",     // wallet prompt open
  CONFIRMING: "CONFIRMING",  // tx submitted, waiting for a block
  WRITING_DB: "WRITING_DB",  // on-chain confirmed, saving to Firestore
  SUCCESS:    "SUCCESS",
  ERROR:      "ERROR",
};

export function useCheckout() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [stage, setStage]   = useState(CHECKOUT_STAGE.IDLE);
  const [error, setError]   = useState(null);
  const [txHash, setTxHash] = useState(undefined);

  const { sendTransaction, data: nativeTxHash, isPending: nativeIsSigning, error: nativeSendError, reset: resetNative } = useSendTransaction();
  const { writeContract,   data: erc20TxHash,  isPending: erc20IsSigning,  error: erc20WriteError,  reset: resetErc20  } = useWriteContract();

  const liveTxHash = nativeTxHash ?? erc20TxHash;

  const {  isSuccess: isTxConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash:  liveTxHash,
    query: { enabled: !!liveTxHash },
  });

  useEffect(() => {
    if (nativeIsSigning || erc20IsSigning) queueMicrotask(() => setStage(CHECKOUT_STAGE.SIGNING));
  }, [nativeIsSigning, erc20IsSigning]);

  useEffect(() => {
    if (liveTxHash) queueMicrotask(() => { setTxHash(liveTxHash); setStage(CHECKOUT_STAGE.CONFIRMING); });
  }, [liveTxHash]);

  useEffect(() => {
    if (!isTxConfirmed || !address) return;
    queueMicrotask(() => setStage(CHECKOUT_STAGE.WRITING_DB));
    updateDoc(doc(db, USERS, address.toLowerCase()), {
      isPremium:  true,
      upgradedAt: serverTimestamp(),
      upgradeTx:  liveTxHash ?? null,
      upgradedOn: chainId,
    })
      .then(() => setStage(CHECKOUT_STAGE.SUCCESS))
      .catch((err) => { console.error("[useCheckout] Firestore write failed:", err); setError(err); setStage(CHECKOUT_STAGE.ERROR); });
  }, [isTxConfirmed, address, chainId, liveTxHash]);

  useEffect(() => {
    const err = nativeSendError ?? erc20WriteError ?? receiptError;
    if (!err) return;
    queueMicrotask(() => {
      // Wallet rejection is not an error we want to surface — just go back to idle
      if (err.name === "UserRejectedRequestError") { setStage(CHECKOUT_STAGE.IDLE); return; }
      setError(err);
      setStage(CHECKOUT_STAGE.ERROR);
    });
  }, [nativeSendError, erc20WriteError, receiptError]);

  const executePayment = useCallback((tokenType, amountWei) => {
    if (!isConnected || !address) return;
    setError(null); setTxHash(undefined);
    resetNative(); resetErc20();
    setStage(CHECKOUT_STAGE.SIGNING);

    if (tokenType === "USDC") {
      writeContract({ address: getUsdcAddress(chainId), abi: ERC20_TRANSFER_ABI, functionName: "transfer", args: [TREASURY_ADDRESS, amountWei] });
    } else if (tokenType === "USDT") {
      writeContract({ address: getUsdtAddress(chainId), abi: ERC20_TRANSFER_ABI, functionName: "transfer", args: [TREASURY_ADDRESS, amountWei] });
    } else {
      sendTransaction({ to: TREASURY_ADDRESS, value: amountWei });
    }
  }, [isConnected, address, chainId, sendTransaction, writeContract, resetNative, resetErc20]);

  const reset = useCallback(() => {
    setStage(CHECKOUT_STAGE.IDLE); setError(null); setTxHash(undefined);
    resetNative(); resetErc20();
  }, [resetNative, resetErc20]);

  return { stage, txHash, error, executePayment, reset };
}
