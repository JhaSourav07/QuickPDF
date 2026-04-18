import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Contrast, X, Download, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { convertToGrayscale } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function Grayscale() {
  const [file, setFile] = useFileStore("Grayscale_file", null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.grayscale.maxFileSizeMb);
  const isLocked     = hasReachedGlobalLimit || fileTooLarge;
  const lockReason   = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel    = fileTooLarge ? `${FREE_LIMITS.grayscale.maxFileSizeMb} MB` : undefined;

  const handleFileSelected = (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
    setError(null); setFile(selectedFile); setResult(null); setProgress({ current: 0, total: 0 });
  };

  const clearFile = () => { setFile(null); setResult(null); setError(null); setProgress({ current: 0, total: 0 }); };

  const handleConvert = async () => {
    setIsProcessing(true); setError(null);
    try {
      const bwBlob = await convertToGrayscale(file, (current, total) => setProgress({ current, total }));
      setResult({ blob: bwBlob, size: bwBlob.size });
      await incrementUsage();
    } catch (err) {
      setError("Conversion failed. The file might be corrupted or encrypted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a"); a.href = url; a.download = `Grayscale_${file.name}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4"><Contrast className="w-8 h-8" /></div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Grayscale PDF</h1>
        <p className="text-lg text-zinc-400">
          Strip colors from your document to save printing ink. Processed locally in your browser.
          {!isPremium && <span className="block text-sm text-zinc-600 mt-1">Free tier: files up to {FREE_LIMITS.grayscale.maxFileSizeMb} MB</span>}
        </p>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        {error && <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</div>}

        {!file ? (
          <Dropzone onFilesSelected={handleFileSelected} multiple={false} disabled={isProcessing} text="Drop a PDF to convert to Black & White" />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
              <div className="flex items-center overflow-hidden mr-4">
                <FileText className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-zinc-200 truncate">{file.name}</span>
                  <span className="text-sm text-zinc-500 mt-0.5">
                    {formatFileSize(file.size)}
                    {fileTooLarge && <span className="text-amber-400 ml-2">(exceeds free limit)</span>}
                  </span>
                </div>
              </div>
              <button onClick={clearFile} disabled={isProcessing} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div key="processing" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 text-center"
                >
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
                  <p className="text-white font-medium">Applying Grayscale Filter...</p>
                  <p className="text-zinc-400 text-sm mt-1">Processing page {progress.current} of {progress.total}</p>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-white h-1.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col items-center justify-center text-center"
                >
                  <Contrast className="w-10 h-10 text-emerald-400 mb-3" />
                  <span className="text-emerald-400 font-bold text-lg">Conversion Complete!</span>
                  <span className="text-emerald-500/80 text-sm mt-1">Ready to download ({formatFileSize(result.size)})</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex justify-end border-t border-white/10 pt-6">
              {result ? (
                <Button onClick={handleDownload} className="w-full sm:w-auto h-12 px-8">
                  <Download className="w-5 h-5 mr-2" />Download B&W PDF
                </Button>
              ) : isLocked ? (
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full sm:w-auto" />
              ) : (
                <Button onClick={handleConvert} disabled={isProcessing} className="w-full sm:w-auto h-12 px-8">
                  {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Converting...</> : <><Contrast className="w-5 h-5 mr-2" />Convert to Grayscale</>}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
