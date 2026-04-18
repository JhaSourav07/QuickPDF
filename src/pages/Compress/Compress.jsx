import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Minimize2, X, Download, Loader2, Zap, ShieldCheck, Gauge, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { compressWithQuality } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function Compress() {
  const [file, setFile] = useFileStore("Compress_file", null);
  const [level, setLevel] = useState("recommended");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.compress.maxFileSizeMb);
  const isLocked     = hasReachedGlobalLimit || fileTooLarge;
  const lockReason   = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel    = fileTooLarge ? `${FREE_LIMITS.compress.maxFileSizeMb} MB` : undefined;

  const options = [
    { id: "low",         label: "High Quality", desc: "90% Quality", icon: <ShieldCheck className="w-5 h-5" />, val: 0.9 },
    { id: "recommended", label: "Balanced",     desc: "60% Quality", icon: <Gauge      className="w-5 h-5" />, val: 0.6 },
    { id: "extreme",     label: "Extreme",      desc: "30% Quality", icon: <Flame      className="w-5 h-5" />, val: 0.3 },
  ];

  const handleFileSelected = (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
    setError(null); setFile(selectedFile); setResult(null);
  };

  const clearFile = () => { setFile(null); setResult(null); setError(null); };

  const handleCompress = async () => {
    setIsProcessing(true); setError(null);
    try {
      const selected = options.find((opt) => opt.id === level);
      const blob = await compressWithQuality(file, selected.val);
      const savings = Math.round(((file.size - blob.size) / file.size) * 100);
      setResult({ blob, size: blob.size, savings: savings > 0 ? savings : 0 });
      await incrementUsage();
    } catch (err) {
      setError("Compression failed. The file might be encrypted or too large.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url; a.download = `QuickPDF_Compressed_${file.name}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4">
          <Minimize2 className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Compress PDF</h1>
        <p className="text-lg text-zinc-400">
          Trade quality for portability. Reduce file size directly in your browser.
          {!isPremium && (
            <span className="block text-sm text-zinc-600 mt-1">
              Free tier: files up to {FREE_LIMITS.compress.maxFileSizeMb} MB
            </span>
          )}
        </p>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</div>
        )}

        {!file ? (
          <Dropzone onFilesSelected={handleFileSelected} multiple={false} disabled={isProcessing} text="Click to upload a PDF" />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
              <div className="flex flex-col overflow-hidden mr-4">
                <span className="font-medium text-zinc-200 truncate">{file.name}</span>
                <span className="text-sm text-zinc-500 mt-0.5">
                  Original size: {formatFileSize(file.size)}
                  {fileTooLarge && <span className="text-amber-400 ml-2">(exceeds free limit)</span>}
                </span>
              </div>
              <button onClick={clearFile} disabled={isProcessing} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Select Compression Level</label>
              <div className="grid sm:grid-cols-3 gap-4">
                {options.map((opt) => (
                  <button key={opt.id} onClick={() => { setLevel(opt.id); setResult(null); }} disabled={isProcessing}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all disabled:opacity-50 ${level === opt.id ? "bg-white/10 border-white/30 text-white" : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:bg-zinc-900/60 hover:border-white/15"}`}
                  >
                    <div className="mb-2">{opt.icon}</div>
                    <span className="font-semibold text-sm">{opt.label}</span>
                    <span className="text-xs opacity-70 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-emerald-400 font-semibold text-sm">Compression Complete</span>
                    <span className="text-emerald-500/80 text-xs mt-0.5">Saved {result.savings}% · New size: {formatFileSize(result.size)}</span>
                  </div>
                  <div className="text-emerald-400 font-bold text-xl">-{result.savings}%</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end border-t border-white/10 pt-6">
              {result ? (
                <Button onClick={handleDownload} className="w-full sm:w-auto">
                  <Download className="w-5 h-5 mr-2" />Download Compressed PDF
                </Button>
              ) : isLocked ? (
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full sm:w-auto" />
              ) : (
                <Button onClick={handleCompress} disabled={isProcessing} className="w-full sm:w-auto">
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Compressing...</>
                  ) : (
                    <><Zap className="w-5 h-5 mr-2 fill-current" />Compress File</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}