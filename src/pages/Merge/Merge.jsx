import React, { useState, useRef, useCallback, useEffect } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import {
  Layers, X, Download, Loader2, Trash2, GripVertical,
  Plus, Eye, EyeOff, CheckCircle2, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }        from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { mergePdfs }     from "../../services/pdf.service";
import { Dropzone }      from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS }   from "../../config/limits";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ─── helpers ──────────────────────────────────────────────────────────────────
let _uid = 0;
function makeId() { return ++_uid; }

async function renderFirstPage(file) {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const url = canvas.toDataURL("image/jpeg", 0.8);
    canvas.width = 0;
    return { thumb: url, numPages: pdf.numPages };
  } catch {
    return { thumb: null, numPages: null };
  }
}

// ─── PDF Card ─────────────────────────────────────────────────────────────────
function PdfCard({ item, onRemove, onPreview, onDragStart, onDragEnter, onDragEnd }) {
  const [over, setOver] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnter={() => { onDragEnter(item.id); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => { onDragEnd(); setOver(false); }}
      className={[
        "relative group flex flex-col items-center gap-2 border rounded-2xl p-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-150",
        over
          ? "border-white/40 bg-white/[0.06] scale-[1.02]"
          : "bg-zinc-900/60 border-white/[0.06] hover:border-white/20",
      ].join(" ")}
    >
      {/* Order badge */}
      <div className="absolute top-2 left-2 z-10 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-zinc-300 px-1.5">
        {item.order}
      </div>

      <GripVertical className="absolute top-2 right-2 w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Thumbnail area */}
      <div
        className="w-full overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center relative"
        style={{ minHeight: 120 }}
      >
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.name}
            className="max-h-40 w-full object-contain rounded-xl"
            draggable={false}
          />
        ) : item.loadingThumb ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[10px]">Loading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-600">
            <FileText className="w-8 h-8" />
          </div>
        )}

        {/* Page count overlay */}
        {item.numPages != null && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-medium text-zinc-400">
            {item.numPages}p
          </div>
        )}

        {/* Preview overlay button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(item); }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
          title="Preview PDF"
        >
          <Eye className="w-6 h-6 text-white drop-shadow" />
        </button>
      </div>

      {/* Name + size */}
      <div className="w-full px-1">
        <p className="text-[11px] text-zinc-300 font-medium truncate">{item.name}</p>
        <p className="text-[10px] text-zinc-600">{formatFileSize(item.size)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/80 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Remove"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  const objectUrl = useRef(null);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!item) return;
    const url = URL.createObjectURL(item.file);
    objectUrl.current = url;
    setSrc(url);
    return () => { URL.revokeObjectURL(url); };
  }, [item]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          key="preview-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative w-full max-w-4xl h-[85vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-sm font-medium text-zinc-200 truncate">{item.name}</span>
              {item.numPages && (
                <span className="shrink-0 text-xs text-zinc-600">· {item.numPages} pages</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 ml-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Iframe viewer */}
          <div className="flex-1 overflow-hidden bg-zinc-950">
            {src ? (
              <iframe
                src={`${src}#toolbar=1&navpanes=0`}
                title={item.name}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function Merge() {
  const [items, setItems] = useFileStore("Merge_items", []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState(null);
  const [previewItem, setPreviewItem]   = useState(null);

  const fileInputRef = useRef(null);
  const dragId       = useRef(null);
  const overId       = useRef(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileLimitExceeded = !isPremium && items.length > FREE_LIMITS.merge.maxFiles;
  const isLocked   = hasReachedGlobalLimit || fileLimitExceeded;
  const lockReason = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel  = fileLimitExceeded ? `${FREE_LIMITS.merge.maxFiles} files max` : undefined;

  // ── add files ──
  const addFiles = useCallback(async (selectedFiles) => {
    const validPdfs = selectedFiles.filter((f) => f.type === "application/pdf");
    if (validPdfs.length !== selectedFiles.length) {
      setError("Some files were ignored — only PDF files are allowed.");
    } else {
      setError(null);
    }
    setDone(false);

    // Build skeleton items first so the UI updates immediately
    const newItems = validPdfs.map((file) => ({
      id: makeId(),
      file,
      name: file.name,
      size: file.size,
      thumb: null,
      numPages: null,
      loadingThumb: true,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Render thumbnails asynchronously one by one
    for (const item of newItems) {
      const { thumb, numPages } = await renderFirstPage(item.file);
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, thumb, numPages, loadingThumb: false } : it
        )
      );
    }
  }, []);

  // ── remove / clear ──
  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setDone(false);
  }

  function clearAll() {
    setItems([]);
    setError(null);
    setDone(false);
  }

  // ── drag-and-drop reorder ──
  function handleDragStart(id) { dragId.current = id; }
  function handleDragEnter(id) { overId.current = id; }
  function handleDragEnd() {
    if (!dragId.current || !overId.current || dragId.current === overId.current) return;
    setItems((prev) => {
      const arr  = [...prev];
      const from = arr.findIndex((it) => it.id === dragId.current);
      const to   = arr.findIndex((it) => it.id === overId.current);
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    dragId.current = null;
    overId.current = null;
  }

  // ── merge ──
  const handleMerge = async () => {
    if (items.length < 2) return;
    try {
      setIsProcessing(true);
      setError(null);
      setDone(false);
      const mergedBlob = await mergePdfs(items.map((it) => it.file));
      const url  = URL.createObjectURL(mergedBlob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `QuickPDF_Merged_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await incrementUsage();
      setDone(true);
    } catch {
      setError("An error occurred while merging the PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const orderedItems = items.map((item, i) => ({ ...item, order: i + 1 }));

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">

      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
        >
          <Layers className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">Merge PDF</h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Combine multiple PDFs into a single file. Drag thumbnails to set the order.
          {!isPremium && (
            <span className="block text-sm text-zinc-600 mt-1">
              Free tier: up to {FREE_LIMITS.merge.maxFiles} files · {FREE_LIMITS.globalRequests} total actions
            </span>
          )}
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <Dropzone
          onFilesSelected={addFiles}
          multiple={true}
          text="Drop PDF files here"
          hintText="PDF only"
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-36">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-white">{items.length}</span> file{items.length !== 1 ? "s" : ""}
              {!isPremium && <span className="text-zinc-600"> / {FREE_LIMITS.merge.maxFiles} max</span>}
              <span className="ml-2 text-zinc-600 text-xs">· drag cards to reorder · hover for preview</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-300 hover:text-white text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add more
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 border border-red-500/20 hover:bg-red-500/10 transition-all text-zinc-500 hover:text-red-400 text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            <AnimatePresence>
              {orderedItems.map((item) => (
                <PdfCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onPreview={setPreviewItem}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Inline add-more zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-2xl text-zinc-600 hover:border-white/25 hover:text-zinc-400 transition-all cursor-pointer text-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Drop more PDFs or click to add
          </div>
        </motion.div>
      )}

      {/* Sticky bottom bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-md border-t border-white/[0.08] px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">{items.length} PDF{items.length !== 1 ? "s" : ""} selected</p>
            {items.length < 2
              ? <p className="text-xs text-zinc-600">Add at least 2 PDFs to merge</p>
              : <p className="text-xs text-white font-medium">Order matches the grid — drag cards to rearrange</p>
            }
          </div>

          <button
            onClick={clearAll}
            className="shrink-0 text-zinc-500 hover:text-white transition-colors text-xs underline underline-offset-4 whitespace-nowrap"
          >
            Clear all
          </button>

          {isLocked ? (
            <UpgradeButton
              reason={lockReason}
              limitLabel={lockLabel}
              isWalletConnected={isWalletConnected}
              isPremium={isPremium}
              className="shrink-0 h-11 px-5 text-sm"
            />
          ) : (
            <Button
              onClick={handleMerge}
              disabled={items.length < 2 || isProcessing}
              className="shrink-0 h-11 px-6 text-sm font-bold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
            >
              {isProcessing
                ? <><Loader2 className="animate-spin mr-2 w-4 h-4" />Merging…</>
                : done
                ? <><CheckCircle2 className="mr-2 w-4 h-4 text-emerald-500" />Downloaded!</>
                : <><Download className="mr-2 w-4 h-4" />Merge & Download</>
              }
            </Button>
          )}
        </div>
      )}

      {/* Preview modal */}
      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </div>
  );
}