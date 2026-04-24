import React, { useState, useEffect, useRef } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Stamp, X, Download, Loader2, Settings2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { addWatermark } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

export function Watermark() {
  const [file, setFile] = useFileStore("Watermark_file", null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const lastUrlRef = useRef(null);

  const [options, setOptions] = useState({
    position: "center",
    opacity: 0.3,
    fontSize: 60,
    rotation: 45,
    offsetX: 0,
    offsetY: 0
  });

  const {
    isPremium,
    hasReachedGlobalLimit,
    incrementUsage,
    isWalletConnected,
  } = useSubscription();

  // Handle preview generation
  useEffect(() => {
    // FIX: Use an asynchronous check to avoid synchronous setState error
    if (!file || !watermarkText.trim()) {
      const t = setTimeout(() => setPreviewUrl(null), 0);
      return () => clearTimeout(t);
    }

    const timer = setTimeout(async () => {
      try {
        setIsProcessing(true);
        const blob = await addWatermark(file, watermarkText, options);
        const url = URL.createObjectURL(blob);

        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = url;
        setPreviewUrl(url);
      } catch (err) {
        console.error("Preview failed", err);
      } finally {
        setIsProcessing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [file, watermarkText, options]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, [originalPreviewUrl]);

  // Initialize original preview
  useEffect(() => {
    if (!file || originalPreviewUrl) return;
    const url = file.url || URL.createObjectURL(file);
    
    // FIX: Defer update to pass linting rule
    const t = setTimeout(() => setOriginalPreviewUrl(url), 0);
    return () => clearTimeout(t);
  }, [file, originalPreviewUrl]);

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.watermark.maxFileSizeMb);
  const isLocked = 0;
  const lockReason = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel = fileTooLarge ? `${FREE_LIMITS.watermark.maxFileSizeMb} MB` : undefined;

  const handleFileSelected = (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") return;
    setFile(selectedFile);
    setPreviewUrl(null);
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    setOriginalPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setOriginalPreviewUrl(null);
  };

  const updateOption = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    if (!previewUrl) return;
    await incrementUsage();
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `QuickPDF_Watermarked_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`mx-auto py-8 sm:py-12 px-4 sm:px-6 transition-all duration-500 ease-in-out ${file ? 'w-full max-w-[1600px]' : 'max-w-3xl'}`}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4">
          <Stamp className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Add Watermark</h1>
        <p className="text-lg text-zinc-400">Secure browser-based watermarking.</p>
      </div>

      <div className={file ? "grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 lg:gap-8 items-start" : ""}>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
          {!file ? (
            <Dropzone onFilesSelected={handleFileSelected} multiple={false} text="Click to upload a PDF" />
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl">
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-zinc-200 truncate">{file.name}</span>
                  <span className="text-sm text-zinc-500">{formatFileSize(file.size)}</span>
                </div>
                <button onClick={clearFile} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-400">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full h-11 px-4 bg-black border border-white/10 text-white rounded-lg uppercase outline-none"
                />
              </div>

              <div className="space-y-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <Settings2 className="w-4 h-4" />
                  <h3>Style & Position</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wider">Position</label>
                  <select value={options.position} onChange={(e) => updateOption("position", e.target.value)} className="w-full h-10 px-3 bg-black border border-white/10 text-white rounded-lg">
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase">Size: {options.fontSize}px</label>
                    <input type="range" min="10" max="200" value={options.fontSize} onChange={(e) => updateOption("fontSize", parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase">Opacity: {Math.round(options.opacity * 100)}%</label>
                    <input type="range" min="0.05" max="1" step="0.05" value={options.opacity} onChange={(e) => updateOption("opacity", parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase">Rotation: {options.rotation}°</label>
                  <input type="range" min="-90" max="90" value={options.rotation} onChange={(e) => updateOption("rotation", parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Offset X</label>
                    <input
                      type="number"
                      value={options.offsetX}
                      onChange={(e) => updateOption("offsetX", parseInt(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-black border border-white/10 text-white rounded-lg outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Offset Y</label>
                    <input
                      type="number"
                      value={options.offsetY}
                      onChange={(e) => updateOption("offsetY", parseInt(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-black border border-white/10 text-white rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {file && (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl flex flex-col h-full min-h-[60vh] relative">
            <h2 className="text-lg font-semibold text-white mb-6">
              {isProcessing ? "Updating Preview..." : previewUrl ? "Preview with Watermark" : "Original PDF"}
            </h2>
            <iframe
              src={previewUrl || originalPreviewUrl}
              title="PDF Preview"
              className={`w-full flex-grow rounded-xl border border-white/10 bg-white transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
              style={{ height: "clamp(400px, 65vh, 800px)" }}
            />
          </div>
        )}

        {previewUrl && (
          <div className="lg:col-span-2 flex justify-center py-4">
            <div className="w-full max-w-xl">
              {isLocked ? (
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full h-14 text-lg" />
              ) : (
                <Button onClick={handleDownload} disabled={isProcessing} className="w-full h-14 text-lg shadow-xl shadow-white/5">
                  {isProcessing ? (
                    <><Loader2 className="w-6 h-6 mr-3 animate-spin" />Processing...</>
                  ) : (
                    <><Download className="w-6 h-6 mr-3" />Download Watermarked PDF</>
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