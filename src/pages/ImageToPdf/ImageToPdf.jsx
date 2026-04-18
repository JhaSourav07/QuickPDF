import React, { useState, useRef, useCallback } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { Image as ImageIcon, X, Download, Loader2, CheckCircle2, Plus, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }        from "../../components/ui/Button";
import { UpgradeButton } from "../../components/ui/UpgradeButton";
import { Dropzone }      from "../../components/pdf/Dropzone";
import { imageToPdf }    from "../../services/pdf.service";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS }   from "../../config/limits";

let _uid = 0;
function makeItem(file) {
  const url = URL.createObjectURL(file);
  return { id: ++_uid, file, url, name: file.name, size: file.size };
}

function ThumbCard({ item, onRemove, onDragStart, onDragEnter, onDragEnd }) {
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
          ? "border-white/40 bg-white/[0.06]"
          : "bg-zinc-900/60 border-white/[0.06]",
      ].join(" ")}
    >
      {/* Page number */}
      <div className="absolute top-2 left-2 z-10 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-black/70 text-[10px] font-bold text-zinc-300 px-1.5">
        {item.order}
      </div>

      <GripVertical className="absolute top-2 right-2 w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Thumbnail */}
      <div className="w-full overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center" style={{ minHeight: 120 }}>
        <img
          src={item.url}
          alt={item.name}
          className="max-h-40 w-full object-contain rounded-xl"
          draggable={false}
        />
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

export function ImageToPdf() {
  const [items, setItems] = useFileStore("ImageToPdf_items", []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]                 = useState(false);
  const [error, setError]               = useState(null);
  const fileInputRef = useRef(null);
  const dragId       = useRef(null);
  const overId       = useRef(null);

  const { isPremium, hasReachedGlobalLimit, incrementUsage, isWalletConnected } = useSubscription();

  const fileLimitExceeded = !isPremium && items.length > FREE_LIMITS.imageToPdf.maxFiles;
  const isLocked   = hasReachedGlobalLimit || fileLimitExceeded;
  const lockReason = hasReachedGlobalLimit ? "global" : "size";
  const lockLabel  = fileLimitExceeded ? `${FREE_LIMITS.imageToPdf.maxFiles} images max` : undefined;

  const addFiles = useCallback((selectedFiles) => {
    const valid = selectedFiles.filter(
      (f) => f.type === "image/jpeg" || f.type === "image/png" || f.type === "image/jpg"
    );
    if (valid.length !== selectedFiles.length)
      setError("Some files were skipped — only JPG and PNG are supported.");
    else
      setError(null);
    setItems((prev) => [...prev, ...valid.map(makeItem)]);
    setDone(false);
  }, []);

  function removeItem(id) {
    setItems((prev) => {
      const removed = prev.find((it) => it.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((it) => it.id !== id);
    });
    setDone(false);
  }

  function clearAll() {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setError(null);
    setDone(false);
  }

  function handleDragStart(id) { dragId.current = id; }
  function handleDragEnter(id) { overId.current = id; }
  function handleDragEnd() {
    if (dragId.current === null || overId.current === null || dragId.current === overId.current) return;
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

  async function handleConvert() {
    if (items.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setDone(false);
    try {
      const files = items.map((it) => it.file);
      const blob  = await imageToPdf(files);
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href      = url;
      a.download  = `QuickPDF_Images_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      await incrementUsage();
      setDone(true);
    } catch (err) {
      setError(err.message || "Conversion failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

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
          <ImageIcon className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">Image to PDF</h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Convert JPG &amp; PNG images into a PDF. Drag thumbnails to set the page order.
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
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
          multiple
          text="Drop JPG or PNG images here"
          accept="image/jpeg, image/png, image/jpg"
          hintText="JPG, PNG only"
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-36">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-white">{items.length}</span> image{items.length !== 1 ? "s" : ""}
              {!isPremium && <span className="text-zinc-600"> / {FREE_LIMITS.imageToPdf.maxFiles} max</span>}
              <span className="ml-2 text-zinc-600 text-xs">· drag cards to reorder</span>
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
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }}
            />
          </div>

          {/* Thumbnail grid — plain HTML5 drag-and-drop so it works in any CSS layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            <AnimatePresence>
              {orderedItems.map((item) => (
                <ThumbCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Inline drop zone to add more */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-2xl text-zinc-600 hover:border-white/25 hover:text-zinc-400 transition-all cursor-pointer text-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Drop more images or click to add
          </div>
        </motion.div>
      )}

      {/* Sticky bottom bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-md border-t border-white/[0.08] px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">{items.length} image{items.length !== 1 ? "s" : ""} selected</p>
            <p className="text-xs text-white font-medium">Page order matches the grid — drag to rearrange</p>
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
              onClick={handleConvert}
              disabled={items.length === 0 || isProcessing}
              className="shrink-0 h-11 px-6 text-sm font-bold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
            >
              {isProcessing
                ? <><Loader2 className="animate-spin mr-2 w-4 h-4" />Converting…</>
                : done
                ? <><CheckCircle2 className="mr-2 w-4 h-4 text-emerald-500" />Downloaded!</>
                : <><Download className="mr-2 w-4 h-4" />Convert to PDF</>
              }
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
