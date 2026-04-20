import React, { useState, useEffect, useRef } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Stamp, X, Download, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { BatchToggle } from "../../components/ui/BatchToggle";
import { BatchPanel } from "../../components/pdf/BatchPanel";
import { useBatchProcess } from "../../hooks/useBatchProcess";
import { addWatermark } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function Watermark() {
  const [file, setFile] = useFileStore("Watermark_file", null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [batchPreviewUrl, setBatchPreviewUrl] = useState(null);
  const batchPreviewRef = useRef(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.watermark.maxFileSizeMb);
  const isLocked = hasReachedGlobalLimit || fileTooLarge;
  const lockReason = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel = fileTooLarge ? `${FREE_LIMITS.watermark.maxFileSizeMb} MB` : undefined;

  const batch = useBatchProcess(
    (f, opts) => addWatermark(f, opts.watermarkText),
    (name) => `QuickPDF_Watermarked_${name}`,
    {
      canProcess: (f) => !hasReachedGlobalLimit && (isPremium || f.size <= mbToBytes(FREE_LIMITS.watermark.maxFileSizeMb)),
      onAfterEach: incrementUsage,
    }
  );

  // Revoke batch preview URL on change or unmount
  useEffect(() => {
    batchPreviewRef.current = batchPreviewUrl;
  }, [batchPreviewUrl]);

  useEffect(() => {
    return () => {
      if (batchPreviewRef.current) URL.revokeObjectURL(batchPreviewRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []); // eslint-disable-line

  const clearBatchPreview = () => {
    if (batchPreviewRef.current) URL.revokeObjectURL(batchPreviewRef.current);
    setBatchPreviewUrl(null);
  };

  const handleFileSelected = (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file."); return;
    }
    setError(null); setFile(selectedFile); setPreviewUrl(null);
  };

  const clearFile = () => { setFile(null); setError(null); setPreviewUrl(null); };

  const handleProcess = async () => {
    if (!file || !watermarkText.trim()) return;
    try {
      setIsProcessing(true); setError(null);
      const blob = await addWatermark(file, watermarkText);
      setPreviewUrl(URL.createObjectURL(blob));
      await incrementUsage();
    } catch {
      setError("Could not read the PDF file. It might be corrupted or encrypted.");
      setFile(null);
    } finally { setIsProcessing(false); }
  };

  const handleBatchFilesAdded = async (files) => {
    batch.addFiles(files);
    if (files.length > 0 && !batchPreviewUrl) {
      try {
        const blob = await addWatermark(files[0], watermarkText);
        clearBatchPreview();
        setBatchPreviewUrl(URL.createObjectURL(blob));
      } catch { /* preview is optional */ }
    }
  };

  const enterBatchMode = (v) => {
    batch.setIsBatchMode(v);
    clearBatchPreview();
    batch.clearFiles();
    // Clear single-file layout state when entering batch
    if (v) { setPreviewUrl(null); setFile(null); }
  };

  return (
    <div className={`mx-auto py-8 sm:py-12 px-4 sm:px-6 transition-all duration-500 ease-in-out ${!batch.isBatchMode && previewUrl ? 'w-full max-w-[1600px]' : 'max-w-3xl'}`}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4">
          <Stamp className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Add Watermark</h1>
        <p className="text-lg text-zinc-400">
          Stamp text across your document securely in your browser.
          {!isPremium && <span className="block text-sm text-zinc-600 mt-1">Free tier: files up to {FREE_LIMITS.watermark.maxFileSizeMb} MB</span>}
        </p>
        <div className="mt-4 flex justify-center">
          <BatchToggle isBatchMode={batch.isBatchMode} onChange={enterBatchMode} disabled={isProcessing || batch.isProcessing} />
        </div>
      </div>

      <div className={!batch.isBatchMode && previewUrl ? "grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 lg:gap-8 items-start" : ""}>
        {batch.isBatchMode ? (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
            {isLocked && (
              <div className="mb-6">
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full" />
              </div>
            )}
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-zinc-400">Watermark Text (applied to all files)</label>
              <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g., CONFIDENTIAL"
                className="w-full h-11 px-4 bg-black border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/20 outline-none transition-all placeholder:text-zinc-600 uppercase" />
            </div>
            <BatchPanel
              batchFiles={batch.batchFiles}
              addFiles={handleBatchFilesAdded}
              removeFile={(i) => { batch.removeFile(i); if (i === 0) clearBatchPreview(); }}
              isProcessing={batch.isProcessing}
              progress={batch.progress}
              error={batch.error}
              done={batch.done}
              runDisabled={isLocked || !watermarkText.trim()}
              onRun={() => batch.runBatch({ watermarkText })}
              runLabel="Watermark All & Download ZIP"
              previewUrl={batchPreviewUrl}
            />
          </div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
            {error && <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">{error}</div>}
            {!file ? (
              <Dropzone onFilesSelected={handleFileSelected} multiple={false} disabled={isProcessing} text="Click to upload a PDF" />
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
                  <div className="flex flex-col overflow-hidden mr-4">
                    <span className="font-medium text-zinc-200 truncate">{file.name}</span>
                    <span className="text-sm text-zinc-500 mt-0.5">
                      {formatFileSize(file.size)}
                      {fileTooLarge && <span className="text-amber-400 ml-2">(exceeds free limit)</span>}
                    </span>
                  </div>
                  <button onClick={clearFile} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Watermark Text</label>
                  <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g., CONFIDENTIAL"
                    className="w-full h-11 px-4 bg-black border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-white/20 outline-none transition-all placeholder:text-zinc-600 uppercase" />
                </div>
                <div className="flex justify-end border-t border-white/10 pt-6">
                  {isLocked ? (
                    <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full sm:w-auto" />
                  ) : (
                    <Button onClick={handleProcess} disabled={isProcessing || !watermarkText.trim()} className="w-full sm:w-auto">
                      {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Download className="w-5 h-5 mr-2" />Generate Preview</>}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!batch.isBatchMode && previewUrl && (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl flex flex-col h-full min-h-[60vh]">
            <h2 className="text-lg font-semibold text-white mb-6">Preview</h2>
            <iframe src={previewUrl} title="Watermarked PDF Preview"
              className="w-full flex-grow rounded-xl border border-white/10 bg-white mb-6"
              style={{ height: "clamp(320px, 60vh, 600px)" }} />
            <div className="mt-auto pt-4 border-t border-white/10">
              <Button className="w-full" onClick={() => {
                const a = document.createElement("a");
                a.href = previewUrl; a.download = `QuickPDF_Watermarked_${Date.now()}.pdf`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}>
                <Download className="w-5 h-5 mr-2" />Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
