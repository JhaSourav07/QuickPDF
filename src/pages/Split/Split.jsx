import React, { useState } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { SplitSquareHorizontal, X, Download, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { splitPdf, getPdfPageCount } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function Split() {
  const [file, setFile] = useFileStore("Split_file", null);
  const [totalPages, setTotalPages] = useState(0);
  const [range, setRange] = useState({ start: 1, end: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.split.maxFileSizeMb);
  const isLocked     = hasReachedGlobalLimit || fileTooLarge;
  const lockReason   = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel    = fileTooLarge ? `${FREE_LIMITS.split.maxFileSizeMb} MB` : undefined;

  const handleFileSelected = async (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    try {
      setIsProcessing(true);
      setError(null);
      const count = await getPdfPageCount(selectedFile);
      setFile(selectedFile);
      setTotalPages(count);
      setRange({ start: 1, end: count });
    } catch {
      setError("Could not read the PDF file. It might be corrupted or encrypted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setTotalPages(0);
    setRange({ start: 1, end: 1 });
    setError(null);
  };

  const handleSplit = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError(null);
      const splitBlob = await splitPdf(file, parseInt(range.start), parseInt(range.end));
      const url = URL.createObjectURL(splitBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QuickPDF_Extracted_p${range.start}-${range.end}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await incrementUsage();
    } catch (err) {
      setError(err.message || "An error occurred while splitting the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4">
          <SplitSquareHorizontal className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Split PDF</h1>
        <p className="text-lg text-zinc-400">
          Extract a specific range of pages from your PDF securely in your browser.
          {!isPremium && (
            <span className="block text-sm text-zinc-600 mt-1">
              Free tier: files up to {FREE_LIMITS.split.maxFileSizeMb} MB
            </span>
          )}
        </p>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
            {error}
          </div>
        )}

        {!file ? (
          <Dropzone onFilesSelected={handleFileSelected} multiple={false} disabled={isProcessing} text="Click to upload a PDF" />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
              <div className="flex flex-col overflow-hidden mr-4">
                <span className="font-medium text-zinc-200 truncate">{file.name}</span>
                <span className="text-sm text-zinc-500 mt-0.5">
                  {totalPages} pages total · {formatFileSize(file.size)}
                  {fileTooLarge && <span className="text-amber-400 ml-2">(exceeds free limit)</span>}
                </span>
              </div>
              <button onClick={clearFile} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-400">Start Page</label>
                <input type="number" min="1" max={range.end} value={range.start}
                  onChange={(e) => setRange({ ...range, start: e.target.value })}
                  className="w-full h-11 px-4 bg-black border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-400">End Page</label>
                <input type="number" min={range.start} max={totalPages} value={range.end}
                  onChange={(e) => setRange({ ...range, end: e.target.value })}
                  className="w-full h-11 px-4 bg-black border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-6">
              {isLocked ? (
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full sm:w-auto" />
              ) : (
                <Button onClick={handleSplit} disabled={isProcessing || range.start > range.end || range.start < 1 || range.end > totalPages} className="w-full sm:w-auto">
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Download className="w-5 h-5 mr-2" />Extract Pages {range.start} to {range.end}</>
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