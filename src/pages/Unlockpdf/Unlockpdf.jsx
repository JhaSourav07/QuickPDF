import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import {
  Unlock, Eye, EyeOff, X, Loader2,
  CheckCircle2, ShieldCheck, AlertTriangle, FileText
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Button }        from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { Dropzone }      from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { unlockPdf, getPdfPageCount } from "../../services/pdf.service";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function UnlockPdf() {
  // Using useFileStore to persist the file state across navigation
  const [file, setFile] = useFileStore("UnlockPdf_file", null);
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState(null);
  const [pageCount, setPageCount]   = useState(0);

  const { isPremium, isWalletConnected: isConnected, hasReachedGlobalLimit, incrementUsage } = useSubscription();

  // Assuming FREE_LIMITS has lockPdf/unlockPdf configurations (using lockPdf limits as a baseline)
  const LIMIT_MB      = FREE_LIMITS.lockPdf?.maxFileSizeMb || 50; 
  const isOverSize    = !isPremium && !!file && file.size > mbToBytes(LIMIT_MB);
  const isLocked      = !isPremium && (isOverSize || hasReachedGlobalLimit);
  const paywallReason = hasReachedGlobalLimit ? "global" : "size";

  const canSubmit   = !!file && password.length > 0 && !isProcessing;

  async function handleUnlock() {
    if (!canSubmit) return;
    
    setIsProcessing(true);
    setError(null);
    setDone(false);
    
    try {
      const blob = await unlockPdf(file, password);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `unlocked_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      
      await incrementUsage();
      setDone(true);
    } catch (err) {
      setError("Failed to unlock the PDF. Please check that the password is correct.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setPassword("");
    setDone(false);
    setError(null);
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">

      {/* ── Header ── */}
      <div className="text-center mb-12">
        <Motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
        >
          <Unlock className="w-10 h-10" />
        </Motion.div>

        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
          Unlock PDF
        </h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Remove password security from your document entirely in the browser — nothing is uploaded to any server.
        </p>

        {/* global-limit banner */}
        <AnimatePresence>
          {hasReachedGlobalLimit && !isPremium && (
            <Motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-6 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><span className="font-semibold text-white">Free limit reached.</span> Connect your wallet to keep going.</span>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Drop zone ── */}
      {!file ? (
        <Dropzone
          onFilesSelected={async (f) => {
            const selectedFile = f[0];
            if (!selectedFile) return;

            setFile(selectedFile);

            const count = await getPdfPageCount(selectedFile);
            setPageCount(count);

            setDone(false);
          }}
          multiple={false}
          text="Drop a locked PDF to unlock it"
        />
      ) : (
        <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* size warning */}
          <AnimatePresence>
            {isOverSize && !isPremium && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 px-4 py-3.5 bg-zinc-900 border border-white/10 rounded-2xl text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">File exceeds {LIMIT_MB} MB free limit.</span>{" "}
                    <span className="text-zinc-400">{formatFileSize(file.size)} uploaded. Upgrade for unlimited sizes.</span>
                  </div>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* error */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">

            {/* File info row */}
            <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(file.size)} • {pageCount} pages</p>
              </div>
              <button
                onClick={reset}
                className="ml-auto p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                Current PDF Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setDone(false); setError(null); }}
                  placeholder="Enter the password to unlock..."
                  className="w-full h-12 px-4 pr-12 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Decryption is performed <span className="text-zinc-300 font-medium">entirely in your browser</span>. No file or password is ever sent to a server. A new, unlocked copy will be downloaded to your device.
              </p>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              {isLocked ? (
                <UpgradeButton
                  reason={paywallReason}
                  limitLabel={`${LIMIT_MB} MB`}
                  isWalletConnected={isConnected}
                  isPremium={isPremium}
                  className="w-full h-16 text-lg"
                />
              ) : (
                <Button
                  onClick={handleUnlock}
                  disabled={!canSubmit}
                  className="w-full h-16 text-lg font-bold rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
                >
                  {isProcessing
                    ? <><Loader2 className="animate-spin mr-3 w-5 h-5" />Unlocking…</>
                    : done
                    ? <><CheckCircle2 className="mr-3 w-5 h-5 text-emerald-500" />Downloaded!</>
                    : <><Unlock className="mr-3 w-5 h-5" />Unlock &amp; Download</>
                  }
                </Button>
              )}
              <button
                onClick={reset}
                className="w-full text-center text-zinc-500 hover:text-white transition-colors text-sm font-medium underline underline-offset-4"
              >
                Upload a different file
              </button>
            </div>
          </div>
        </Motion.div>
      )}
    </div>
  );
}

export default UnlockPdf;