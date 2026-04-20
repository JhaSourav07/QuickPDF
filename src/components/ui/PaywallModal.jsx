
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { X, Lock, Zap, Loader2, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, ChevronRight } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import { useCheckout, CHECKOUT_STAGE } from "../../hooks/useCheckout";
import { useCryptoPrices } from "../../hooks/useCryptoPrices";
import { getUsdcAddress, getUsdtAddress, getStableDecimals, SEPOLIA_ETH_PRICE } from "../../config/contracts";

const TARGET_USD = 5;

const STAGE_COPY = {
  [CHECKOUT_STAGE.SIGNING]:    { title: "Awaiting Wallet Signature…",  sub: "Approve the transaction in your wallet." },
  [CHECKOUT_STAGE.CONFIRMING]: { title: "Confirming on Blockchain…",   sub: "Transaction submitted — waiting for a block." },
  [CHECKOUT_STAGE.WRITING_DB]: { title: "Finalising Your Access…",     sub: "Confirmed! Updating your account." },
};


const CHAIN = { ETH: 1, MATIC: 137, BNB: 56, AVAX: 43114, ARB: 42161, SEPOLIA: 11155111 };

const EXPLORER = {
  [CHAIN.ETH]:    "https://etherscan.io/tx/",
  [CHAIN.MATIC]:  "https://polygonscan.com/tx/",
  [CHAIN.BNB]:    "https://bscscan.com/tx/",
  [CHAIN.AVAX]:   "https://snowtrace.io/tx/",
  [CHAIN.ARB]:    "https://arbiscan.io/tx/",
  [CHAIN.SEPOLIA]:"https://sepolia.etherscan.io/tx/",
};


// Not a hook — just a plain function that builds the token list
function buildTokenOptions(prices, chainId) {
  const usdcOk = !!getUsdcAddress(chainId);
  const usdtOk = !!getUsdtAddress(chainId);

  // BSC uses 18-decimal stablecoins; every other chain uses 6
  const dec = getStableDecimals(chainId);
  const stableRaw = parseUnits(TARGET_USD.toFixed(2), dec);

  return [
    {
      key:     "ETH",
      label:   "Ethereum",
      symbol:  "ETH",
      network: "Ethereum Mainnet",
      chainId: CHAIN.ETH,
      color:   "#627EEA",
      amount:  prices?.eth?.amount,
      wei:     prices?.eth?.wei,
      type:    "native",
    },
    {
      key:     "MATIC",
      label:   "Polygon",
      symbol:  "MATIC",
      network: "Polygon",
      chainId: CHAIN.MATIC,
      color:   "#8247E5",
      amount:  prices?.matic?.amount,
      wei:     prices?.matic?.wei,
      type:    "native",
    },
    {
      key:     "BNB",
      label:   "BNB Chain",
      symbol:  "BNB",
      network: "BSC",
      chainId: CHAIN.BNB,
      color:   "#F0B90B",
      amount:  prices?.bnb?.amount,
      wei:     prices?.bnb?.wei,
      type:    "native",
    },
    {
      key:     "AVAX",
      label:   "Avalanche",
      symbol:  "AVAX",
      network: "Avalanche C-Chain",
      chainId: CHAIN.AVAX,
      color:   "#E84142",
      amount:  prices?.avax?.amount,
      wei:     prices?.avax?.wei,
      type:    "native",
    },
    {
      key:     "USDC",
      label:   "USD Coin",
      symbol:  "USDC",
      network: "Any supported chain",
      color:   "#2775CA",
      amount:  TARGET_USD.toFixed(2),
      wei:     usdcOk ? stableRaw : undefined,
      type:    "erc20",
      disabled: !usdcOk,
      disabledReason: !usdcOk ? "Switch to Ethereum, Polygon, BSC, Arbitrum, or Avalanche" : undefined,
    },
    {
      key:     "USDT",
      label:   "Tether",
      symbol:  "USDT",
      network: "Any supported chain",
      color:   "#26A17B",
      amount:  TARGET_USD.toFixed(2),
      wei:     usdtOk ? stableRaw : undefined,
      type:    "erc20",
      disabled: !usdtOk,
      disabledReason: !usdtOk ? "Switch to Ethereum, Polygon, BSC, Arbitrum, or Avalanche" : undefined,
    },
    {
      key:     "SEPOLIA",
      label:   "Sepolia Testnet",
      symbol:  "SepoliaETH",
      network: "Sepolia Testnet",
      chainId: CHAIN.SEPOLIA,
      color:   "#A259FF",
      amount:  "0.01",
      wei:     SEPOLIA_ETH_PRICE,
      type:    "native",
      badge:   "Testnet",
    },
  ];
}

function TokenIcon({ symbol, color, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.3 }}
    >
      {symbol.slice(0, 1)}
    </div>
  );
}

function TxLink({ txHash, chainId }) {
  if (!txHash) return null;
  const base = EXPLORER[chainId] ?? "https://etherscan.io/tx/";
  return (
    <a href={`${base}${txHash}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mt-3"
    >
      <ExternalLink className="w-3 h-3" />View on Explorer
    </a>
  );
}

export function PaywallModal({ isOpen, onClose, reason = "size", limitLabel, isPremium }) {
  const { isConnected: isWalletConnected } = useAccount();
  const chainId = useChainId();
  const { eth, matic, bnb, avax, usdc, usdt, isError: priceError } = useCryptoPrices(TARGET_USD);
  const { stage, txHash, error, executePayment, reset } = useCheckout();
  const tokens = buildTokenOptions({ eth, matic, bnb, avax, usdc, usdt }, chainId);

  const [selectedToken, setSelectedToken] = useState(null);

  const isProcessing = [CHECKOUT_STAGE.SIGNING, CHECKOUT_STAGE.CONFIRMING, CHECKOUT_STAGE.WRITING_DB].includes(stage);
  const isSuccess = stage === CHECKOUT_STAGE.SUCCESS || isPremium;

  useEffect(() => {
    if (isSuccess && isOpen) { const t = setTimeout(onClose, 2200); return () => clearTimeout(t); }
  }, [isSuccess, isOpen, onClose]);

  useEffect(() => { if (!isOpen) { reset(); setSelectedToken(null); } }, [isOpen]); // eslint-disable-line

  const { switchChainAsync } = useSwitchChain();
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  function handleClose() { if (isProcessing || isSwitchingChain) return; onClose(); }

  async function handlePay() {
    if (!selectedToken || !selectedToken.wei) return;
    try {
      // For native tokens: ensure the wallet is on the correct chain first
      if (selectedToken.chainId && chainId !== selectedToken.chainId) {
        setIsSwitchingChain(true);
        await switchChainAsync({ chainId: selectedToken.chainId });
        setIsSwitchingChain(false);
      }
      executePayment(selectedToken.key, selectedToken.wei);
    } catch {
      // User rejected chain switch — don't proceed
      setIsSwitchingChain(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div key="pw-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          <Motion.div key="pw-card" initial={{ opacity: 0, y: 60, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#070707] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-[0_0_120px_rgba(255,255,255,0.04)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="p-6 sm:p-8">
              {!isProcessing && (
                <button onClick={handleClose} aria-label="Close"
                  className="absolute top-5 right-5 text-zinc-600 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence mode="wait">

                {isSuccess ? (
                  <Motion.div key="success" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <Motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mb-5"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </Motion.div>
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase mb-2">Lifetime Access Unlocked!</h2>
                    <p className="text-zinc-400 text-sm">All limits removed. Your files, your RAM, forever.</p>
                  </Motion.div>

                ) : isProcessing ? (
                  <Motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-white uppercase mb-2">
                      {STAGE_COPY[stage]?.title ?? "Processing…"}
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-xs">{STAGE_COPY[stage]?.sub}</p>
                    <TxLink txHash={txHash} chainId={chainId} />
                  </Motion.div>

                ) : (
                  <Motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {reason === "size" ? <Lock className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-lg font-black tracking-tight text-white uppercase">
                          {reason === "size" ? "File Exceeds Free Limit" : "Free Actions Exhausted"}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-0.5">
                          {reason === "size" ? `Free tier supports files up to ${limitLabel ?? "10 MB"}.` : "You've used all 15 free actions."}{" "}
                          Unlock forever for <span className="text-white font-semibold">${TARGET_USD}</span>.
                        </p>
                      </div>
                    </div>

                    {stage === CHECKOUT_STAGE.ERROR && error && (
                      <div className="flex items-start gap-2.5 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error.shortMessage ?? error.message ?? "Transaction failed. Please try again."}</span>
                      </div>
                    )}

                    {priceError && (
                      <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />Using estimated prices — live rates unavailable.
                      </div>
                    )}

                    {!isWalletConnected ? (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold">Connect your wallet to continue</p>
                        <ConnectButton />
                      </div>

                    ) : (
                      <div className="space-y-4">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Choose payment method</p>

                        <div className="grid grid-cols-2 gap-2.5">
                          {tokens.map((token) => {
                            const isSelected = selectedToken?.key === token.key;
                            const isDisabled = token.disabled || !token.wei;
                            return (
                              <button key={token.key} onClick={() => !isDisabled && setSelectedToken(token)} disabled={isDisabled}
                                title={token.disabledReason}
                                className={[
                                  "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all",
                                  isSelected
                                    ? "border-white/40 bg-white/8 ring-1 ring-white/20"
                                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15",
                                  isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                                ].join(" ")}
                              >
                                <TokenIcon symbol={token.symbol} color={token.color} size={34} />
                                <div className="overflow-hidden min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-bold text-white">{token.symbol}</span>
                                    {token.badge && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                        {token.badge}
                                      </span>
                                    )}
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="text-xs text-zinc-500 truncate block">
                                    {token.amount ? (token.type === "native" ? `~${token.amount}` : token.amount) : "loading…"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence>
                          {selectedToken && (
                            <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-zinc-400 space-y-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  Pay <span className="text-white font-semibold">~{selectedToken.amount} {selectedToken.symbol}</span>
                                  {selectedToken.chainId && (
                                    <span className="ml-1.5 text-zinc-600">on {selectedToken.network}</span>
                                  )}
                                </div>
                              </div>
                              {selectedToken.chainId && chainId !== selectedToken.chainId && (
                                <p className="text-amber-400/80 text-[11px] flex items-center gap-1.5">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  Your wallet will be asked to switch to {selectedToken.network} first.
                                </p>
                              )}
                            </Motion.div>
                          )}
                        </AnimatePresence>

                        <button onClick={handlePay} disabled={!selectedToken || !selectedToken.wei || isSwitchingChain}
                          className="w-full flex items-center justify-center gap-3 h-13 px-5 py-3.5 bg-white text-black font-bold text-sm tracking-wide rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {isSwitchingChain ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Switching Network…</>
                          ) : selectedToken && selectedToken.chainId && chainId !== selectedToken.chainId ? (
                            <><Zap className="w-4 h-4" />Switch + Pay ${TARGET_USD} in {selectedToken?.symbol}</>
                          ) : (
                            <><Zap className="w-4 h-4" />{selectedToken ? `Pay $${TARGET_USD} in ${selectedToken.symbol}` : "Select a payment method"}</>
                          )}
                        </button>
                      </div>
                    )}

                    <button onClick={handleClose} className="mt-4 w-full text-center text-zinc-700 hover:text-zinc-400 transition-colors text-sm py-2">
                      Maybe later
                    </button>

                    <p className="mt-2 text-[11px] text-zinc-700 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" />
                      Files never leave your browser. Only wallet entitlement is stored.
                    </p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
