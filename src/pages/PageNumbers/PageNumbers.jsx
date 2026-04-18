import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Hash, Download, Loader2, CheckCircle2, AlertTriangle, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }        from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { Dropzone }      from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { addPageNumbers } from "../../services/pdf.service";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

const POSITIONS = [
  { value: "left",   label: "Left",   Icon: AlignLeft   },
  { value: "center", label: "Center", Icon: AlignCenter },
  { value: "right",  label: "Right",  Icon: AlignRight  },
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16];

export function PageNumbers() {
  const [file, setFile] = useFileStore("PageNumbers_file", null);
  const [position, setPosition]     = useState("center");
  const [fontSize, setFontSize]     = useState(11);
  const [prefix, setPrefix]         = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState(null);

  const { isPremium, isWalletConnected: isConnected, hasReachedGlobalLimit, incrementUsage } = useSubscription();
  const LIMIT_MB = FREE_LIMITS.pageNumbers.maxFileSizeMb;
  const isOverSizeLimit = !isPremium && !!file && file.size > mbToBytes(LIMIT_MB);
  const isLocked        = !isPremium && (isOverSizeLimit || hasReachedGlobalLimit);
  const paywallReason   = hasReachedGlobalLimit ? "global" : "size";

  async function handleApply() {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setDone(false);
    try {
      const blob = await addPageNumbers(file, { position, fontSize, prefix, startNumber });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `numbered_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      await incrementUsage();
      setDone(true);
    } catch (err) {
      setError("Failed to process the PDF. It may be encrypted or corrupted.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  const previewLabel = `${prefix}${startNumber}`;

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">

      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
        >
          <Hash className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">Page Numbers</h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Auto-stamp sequential numbers on every page footer. Processed entirely in your browser.
        </p>

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

      {!file ? (
        <Dropzone onFilesSelected={(f) => { setFile(f[0]); setDone(false); }} multiple={false} text="Drop a PDF to number its pages" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Size warning */}
          <AnimatePresence>
            {isOverSizeLimit && !isPremium && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 px-4 py-3.5 bg-zinc-900 border border-white/10 rounded-2xl text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">File exceeds {LIMIT_MB} MB free limit.</span>{" "}
                    <span className="text-zinc-400">{formatFileSize(file.size)} file. Upgrade for unlimited sizes.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">

            {/* File info */}
            <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => { setFile(null); setDone(false); setError(null); }}
                className="ml-auto text-zinc-600 hover:text-white transition-colors text-xs underline underline-offset-4 whitespace-nowrap"
              >
                Change file
              </button>
            </div>

            {/* Position picker */}
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPosition(value)}
                    className={[
                      "flex flex-col items-center gap-2 py-4 rounded-2xl border text-sm font-medium transition-all",
                      position === value
                        ? "border-white/40 bg-white/8 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/20",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Font Size</label>
              <div className="flex gap-2 flex-wrap">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={[
                      "w-12 h-10 rounded-xl border text-sm font-semibold transition-all",
                      fontSize === s
                        ? "border-white/40 bg-white/8 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/20",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Prefix + start number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Prefix (optional)</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder='e.g. "Page " or "- "'
                  className="w-full h-11 px-4 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Start number</label>
                <input
                  type="number"
                  value={startNumber}
                  min={0}
                  max={9999}
                  onChange={(e) => setStartNumber(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-11 px-4 bg-zinc-900/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Live preview strip */}
            <div className="flex items-end justify-center h-20 border border-white/[0.06] rounded-2xl bg-zinc-900/30 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-0.5 bg-white/[0.03] absolute" style={{ top: "30%" }} />
                <div className="w-full h-0.5 bg-white/[0.03] absolute" style={{ top: "60%" }} />
              </div>
              <span
                className={[
                  "mb-3 text-zinc-400 font-semibold pointer-events-none",
                  position === "left" ? "self-end ml-6 mr-auto" : position === "right" ? "self-end mr-6 ml-auto" : "",
                ].join(" ")}
                style={{ fontSize }}
              >
                {previewLabel}
              </span>
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
                  onClick={handleApply}
                  disabled={isProcessing}
                  className="w-full h-16 text-lg font-bold rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
                >
                  {isProcessing
                    ? <><Loader2 className="animate-spin mr-3 w-5 h-5" />Adding numbers…</>
                    : done
                    ? <><CheckCircle2 className="mr-3 w-5 h-5 text-emerald-500" />Downloaded!</>
                    : <><Download className="mr-3 w-5 h-5" />Apply &amp; Download</>
                  }
                </Button>
              )}
              <button
                onClick={() => { setFile(null); setDone(false); setError(null); }}
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
