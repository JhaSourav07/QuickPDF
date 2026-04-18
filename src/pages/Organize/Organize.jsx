import React, { useState, useCallback, useRef } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { LayoutGrid, Trash2, Download, Loader2, RotateCcw, FileWarning, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { Dropzone } from "../../components/pdf/Dropzone";
import { getPdfThumbnails, organizePdf } from "../../services/pdf.service";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";

function ThumbnailCard({ item, pageNumber, onRemove, isProcessing, isDragOver, onDragStart, onDragEnter, onDragEnd }) {
  return (
    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }} transition={{ duration: 0.2 }}>
      <div draggable={!isProcessing}
        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); onDragEnter(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnd={(e) => { e.preventDefault(); onDragEnd(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className={`relative group select-none ${isProcessing ? "opacity-50 cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div className={`relative rounded-xl overflow-hidden border transition-all duration-150 ${isDragOver ? "border-white ring-2 ring-white scale-[1.04] bg-zinc-800" : "border-white/10 bg-zinc-900 group-hover:border-white/30"}`}>
          <img src={item.url} alt={`Page ${pageNumber}`} className="w-full h-auto block pointer-events-none" draggable={false} />
          <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="p-1 rounded bg-black/60 backdrop-blur-sm"><GripVertical className="w-3 h-3 text-white/70" /></div>
          </div>
          {!isProcessing && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="p-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-lg transition-colors" aria-label={`Remove page ${pageNumber}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-1.5 text-center text-xs font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">{pageNumber}</div>
      </div>
    </motion.div>
  );
}

export function Organize() {
  const [file, setFile] = useFileStore("Organize_file", null);
  const [thumbnails, setThumbnails] = useFileStore("Organize_thumbnails", []);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileTooLarge = !isPremium && file && file.size > mbToBytes(FREE_LIMITS.organize.maxFileSizeMb);
  const isLocked     = hasReachedGlobalLimit || fileTooLarge;
  const lockReason   = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel    = fileTooLarge ? `${FREE_LIMITS.organize.maxFileSizeMb} MB` : undefined;

  const handleFilesSelected = useCallback(async (selectedFiles) => {
    const selectedFile = selectedFiles[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
    setError(null); setFile(selectedFile); setThumbnails([]); setIsLoading(true);
    try {
      const pages = await getPdfThumbnails(selectedFile);
      setThumbnails(pages);
    } catch (err) {
      setError("Could not read the PDF. It may be encrypted, corrupted, or empty.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDragStart  = useCallback((index) => { dragItem.current = index; }, []);
  const handleDragEnter  = useCallback((index) => { if (dragItem.current === index) return; dragOverItem.current = index; setDragOverIndex(index); }, []);
  const handleDragEnd    = useCallback(() => {
    setDragOverIndex(null);
    const from = dragItem.current; const to = dragOverItem.current;
    if (from === null || to === null || from === to) { dragItem.current = null; dragOverItem.current = null; return; }
    setThumbnails((prev) => { const next = [...prev]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; });
    dragItem.current = null; dragOverItem.current = null;
  }, []);
  const handleRemovePage = useCallback((id) => setThumbnails((prev) => prev.filter((t) => t.id !== id)), []);
  const handleReset      = useCallback(() => { setFile(null); setThumbnails([]); setError(null); setIsLoading(false); setIsProcessing(false); setDragOverIndex(null); }, []);

  const handleDownload = useCallback(async () => {
    if (!file || thumbnails.length === 0) return;
    setIsProcessing(true); setError(null);
    try {
      const pageIndices = thumbnails.map((t) => t.originalIndex);
      const blob = await organizePdf(file, pageIndices);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `QuickPDF_Organized_${file.name}`; a.click();
      URL.revokeObjectURL(url);
      await incrementUsage();
    } catch (err) {
      setError("Failed to build the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [file, thumbnails, incrementUsage]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4"><LayoutGrid className="w-8 h-8" /></div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Organize PDF</h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto">
          Drag to reorder pages, hover a thumbnail to delete it, then download your reorganized document.
          {!isPremium && <span className="block text-sm text-zinc-600 mt-1">Free tier: files up to {FREE_LIMITS.organize.maxFileSizeMb} MB</span>}
        </p>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        <AnimatePresence>
          {error && (
            <motion.div key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 flex items-start gap-3"
            >
              <FileWarning className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {!file && !isLoading && <Dropzone onFilesSelected={handleFilesSelected} multiple={false} disabled={isLoading} text="Click to upload a PDF" />}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
            <p className="text-sm font-medium">Rendering page thumbnails…</p>
            <p className="text-xs text-zinc-600">Large files may take a moment.</p>
          </div>
        )}

        {!isLoading && file && thumbnails.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
              <div className="flex flex-col">
                <span className="font-medium text-zinc-200 truncate max-w-xs">{file.name}</span>
                <span className="text-xs text-zinc-500 mt-0.5">
                  {thumbnails.length} {thumbnails.length === 1 ? "page" : "pages"} · {formatFileSize(file.size)}
                  {fileTooLarge && <span className="text-amber-400 ml-2">(exceeds free limit)</span>}
                </span>
              </div>
              <button onClick={handleReset} disabled={isProcessing} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors disabled:opacity-50">
                <RotateCcw className="w-3.5 h-3.5" />Change file
              </button>
            </div>

            <p className="text-xs text-zinc-600 text-center">Drag thumbnails to reorder · Hover a page to reveal the delete button</p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {thumbnails.map((item, index) => (
                  <ThumbnailCard key={item.id} item={item} pageNumber={index + 1} onRemove={handleRemovePage} isProcessing={isProcessing}
                    isDragOver={dragOverIndex === index} onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
              <p className="text-xs text-zinc-600 text-center sm:text-left">
                Output will contain {thumbnails.length} {thumbnails.length === 1 ? "page" : "pages"} in the order shown above.
              </p>
              {isLocked ? (
                <UpgradeButton reason={lockReason} limitLabel={lockLabel} isWalletConnected={isWalletConnected} isPremium={isPremium} className="w-full sm:w-auto" />
              ) : (
                <Button onClick={handleDownload} disabled={isProcessing || thumbnails.length === 0} className="w-full sm:w-auto">
                  {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Building PDF…</> : <><Download className="w-5 h-5 mr-2" />Download Organized PDF</>}
                </Button>
              )}
            </div>
          </div>
        )}

        {!isLoading && file && thumbnails.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4 text-zinc-500">
            <FileWarning className="w-10 h-10" />
            <p className="font-medium">All pages removed</p>
            <p className="text-sm text-zinc-600">Nothing left to download. Reset to start over.</p>
            <Button variant="outline" onClick={handleReset} className="mt-2"><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
