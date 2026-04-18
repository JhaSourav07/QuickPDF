import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import {
  Lock, Eye, EyeOff, X, Download, Loader2,
  CheckCircle2, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }        from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { Dropzone }      from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { lockPdf }       from "../../services/pdf.service";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

/* password strength helpers */
function calcStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}
const STRENGTH_LABELS = ["", "Weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#22c55e"];

export function LockPdf() {
  const [file, setFile] = useFileStore("LockPdf_file", null);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState(null);

  const { isPremium, isWalletConnected: isConnected, hasReachedGlobalLimit, incrementUsage } =
    useSubscription();

  const LIMIT_MB      = FREE_LIMITS.lockPdf.maxFileSizeMb;
  const isOverSize    = !isPremium && !!file && file.size > mbToBytes(LIMIT_MB);
  const isLocked      = !isPremium && (isOverSize || hasReachedGlobalLimit);
  const paywallReason = hasReachedGlobalLimit ? "global" : "size";

  const strength    = calcStrength(password);
  const mismatch    = confirm.length > 0 && password !== confirm;
  const canSubmit   = !!file && password.length > 0 && password === confirm && !isProcessing;

  async function handleLock() {
    if (!canSubmit) return;
    setIsProcessing(true);
    setError(null);
    setDone(false);
    try {
      const blob = await lockPdf(file, password);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `locked_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      await incrementUsage();
      setDone(true);
    } catch (err) {
      setError(
        err?.message?.includes("password") || err?.message?.includes("encrypted")
          ? "This PDF is already encrypted. Upload an unlocked file."
          : "Failed to lock the PDF. It may be corrupted or encrypted."
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setFile(null);
    setPassword("");
    setConfirm("");
    setDone(false);
    setError(null);
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">

      {/* ── Header ── */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
        >
          <Lock className="w-10 h-10" />
        </motion.div>

        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
          Lock PDF
        </h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Password-protect your document entirely in the browser — nothing is uploaded to any server.
        </p>

        {/* global limit banner */}
        <AnimatePresence>
          {hasReachedGlobalLimit && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-6 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><span className="font-semibold text-white">Free limit reached.</span> Connect your wallet to keep going.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Drop zone ── */}
      {!file ? (
        <Dropzone
          onFilesSelected={(f) => { setFile(f[0]); setDone(false); }}
          multiple={false}
          text="Drop a PDF to lock it"
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* size warning */}
          <AnimatePresence>
            {isOverSize && !isPremium && (
              <motion.div
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
              </motion.div>
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
                <Lock className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
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
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setDone(false); }}
                  placeholder="Enter a strong password"
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

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength ? STRENGTH_COLORS[strength] : "#27272a",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password field */}
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setDone(false); }}
                  placeholder="Re-enter your password"
                  className={[
                    "w-full h-12 px-4 pr-12 bg-zinc-900/60 border rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors",
                    mismatch
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-white/30",
                  ].join(" ")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {mismatch && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400"
                  >
                    Passwords don't match
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Encryption is performed <span className="text-zinc-300 font-medium">entirely in your browser</span> using RC4-128. No file or password is ever sent to a server. Keep a copy of your password, we cannot recover it.
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
                  onClick={handleLock}
                  disabled={!canSubmit}
                  className="w-full h-16 text-lg font-bold rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
                >
                  {isProcessing
                    ? <><Loader2 className="animate-spin mr-3 w-5 h-5" />Encrypting…</>
                    : done
                    ? <><CheckCircle2 className="mr-3 w-5 h-5 text-emerald-500" />Downloaded!</>
                    : <><Lock className="mr-3 w-5 h-5" />Lock &amp; Download</>
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
        </motion.div>
      )}
    </div>
  );
}
