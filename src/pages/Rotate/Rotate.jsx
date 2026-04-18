import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import { RotateCw, RotateCcw, Download, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }         from "../../components/ui/Button";
import { UpgradeButton }  from "../../components/ui/UpgradeButton";
import { rotatePdfPerPage } from "../../services/pdf.service";
import { Dropzone }       from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";
import { useSubscription } from "../../hooks/useSubscription";
import { FREE_LIMITS, mbToBytes } from "../../config/limits";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const PAGE_BATCH = 10;
const THUMB_SCALE = 0.4;

function usePdfPages(file) {
  const [pages, setPages]           = useState([]);   // rendered so far
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading]   = useState(false);
  const pdfRef    = useRef(null);
  const loadedRef = useRef(0);

  // Open the PDF once when the file changes
  useEffect(() => {
    if (!file) { setPages([]); setTotalCount(0); pdfRef.current = null; loadedRef.current = 0; return; }

    let cancelled = false;
    setPages([]); setTotalCount(0); loadedRef.current = 0;

    (async () => {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      if (cancelled) return;
      pdfRef.current = pdf;
      setTotalCount(pdf.numPages);
      loadBatch(pdf, 1, Math.min(PAGE_BATCH, pdf.numPages), cancelled);
    })();

    return () => { cancelled = true; };
  }, [file]); // eslint-disable-line

  async function loadBatch(pdf, from, to, cancelled) {
    setIsLoading(true);
    const results = [];

    for (let n = from; n <= to; n++) {
      if (cancelled) break;
      const page     = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: THUMB_SCALE });
      const canvas   = document.createElement("canvas");
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      results.push({ index: n - 1, url: canvas.toDataURL("image/jpeg", 0.75) });
      // release canvas memory
      canvas.width = 0;
    }

    if (!cancelled) {
      setPages((prev) => [...prev, ...results]);
      loadedRef.current = to;
    }
    if (!cancelled) setIsLoading(false);
  }

  const loadMore = useCallback(() => {
    const pdf = pdfRef.current;
    if (!pdf || isLoading) return;
    const from = loadedRef.current + 1;
    if (from > pdf.numPages) return;
    const to = Math.min(from + PAGE_BATCH - 1, pdf.numPages);
    loadBatch(pdf, from, to, false);
  }, [isLoading]); // eslint-disable-line

  const hasMore = loadedRef.current < totalCount;

  return { pages, totalCount, hasMore, isLoading, loadMore };
}

function PageCard({ page, rotation, onLeft, onRight }) {
  const deg = ((rotation % 360) + 360) % 360;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-3"
    >
      <div className="relative overflow-hidden rounded-xl bg-zinc-800 w-full flex items-center justify-center" style={{ minHeight: 140 }}>
        <motion.img
          src={page.url}
          alt={`Page ${page.index + 1}`}
          animate={{ rotate: deg }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="max-h-48 object-contain rounded"
          draggable={false}
        />
      </div>

      <span className="text-xs text-zinc-500 font-medium">
        Page {page.index + 1}
        {deg !== 0 && <span className="ml-1.5 text-white font-semibold">{deg}°</span>}
      </span>

      <div className="flex gap-2 w-full">
        <button
          onClick={onLeft}
          className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-300 hover:text-white text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" /> −90°
        </button>
        <button
          onClick={onRight}
          className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-300 hover:text-white text-xs font-medium"
        >
          <RotateCw className="w-3.5 h-3.5" /> +90°
        </button>
      </div>
    </motion.div>
  );
}

export function Rotate() {
  const [file, setFile] = useFileStore("Rotate_file", null);
  const [rotations, setRotations]   = useState({});   // { pageIndex: deltaDegrees }
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone]             = useState(false);
  const sentinelRef = useRef(null);

  const { isPremium, isWalletConnected: isConnected, hasReachedGlobalLimit, incrementUsage } = useSubscription();
  const ROTATE_LIMIT_MB = FREE_LIMITS.rotate.maxFileSizeMb;
  const isOverSizeLimit = !isPremium && !!file && file.size > mbToBytes(ROTATE_LIMIT_MB);
  const isLocked        = !isPremium && (isOverSizeLimit || hasReachedGlobalLimit);
  const paywallReason   = hasReachedGlobalLimit ? "global" : "size";

  const { pages, totalCount, hasMore, isLoading, loadMore } = usePdfPages(file);

  // IntersectionObserver sentinel → auto-loads next batch on scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !isLoading) loadMore(); },
      { threshold: 0.1 }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, isLoading, loadMore]);

  function rotate(pageIndex, delta) {
    setRotations((prev) => ({ ...prev, [pageIndex]: ((prev[pageIndex] ?? 0) + delta) % 360 }));
    setDone(false);
  }

  function rotateAll(delta) {
    setRotations((prev) => {
      const next = { ...prev };
      for (let i = 0; i < totalCount; i++) next[i] = ((prev[i] ?? 0) + delta) % 360;
      return next;
    });
    setDone(false);
  }

  const hasAnyRotation = Object.values(rotations).some((r) => r !== 0);

  async function handleDownload() {
    setIsProcessing(true);
    setDone(false);
    try {
      const pageRotations = Array.from({ length: totalCount }, (_, i) => rotations[i] ?? 0);
      const blob = await rotatePdfPerPage(file, pageRotations);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `rotated_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      await incrementUsage();
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Failed to rotate the PDF. It may be encrypted.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setRotations({});
    setDone(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white text-black mb-6 shadow-[0_0_50px_rgba(255,255,255,0.15)]"
        >
          <RefreshCw className="w-10 h-10" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">Rotate PDF</h1>
        <p className="text-zinc-500 text-lg font-light max-w-md mx-auto">
          Rotate individual pages or the whole document. Processed entirely in your browser.
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
        <Dropzone onFilesSelected={(f) => setFile(f[0])} multiple={false} text="Drop PDF to rotate" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-36">

          {/* Size warning */}
          <AnimatePresence>
            {isOverSizeLimit && !isPremium && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 px-4 py-3.5 bg-zinc-900 border border-white/10 rounded-2xl text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">File exceeds {ROTATE_LIMIT_MB} MB free limit.</span>{" "}
                    <span className="text-zinc-400">Your file is {formatFileSize(file.size)}. Upgrade to unlock unlimited sizes.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-zinc-900/50 border border-white/[0.06] rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="font-semibold text-white">{file.name}</span>
              <span className="text-zinc-600">·</span>
              <span>{formatFileSize(file.size)}</span>
              {totalCount > 0 && <><span className="text-zinc-600">·</span><span>{totalCount} pages</span></>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => rotateAll(-90)} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-300 hover:text-white text-xs font-medium">
                <RotateCcw className="w-3.5 h-3.5" /> All −90°
              </button>
              <button onClick={() => rotateAll(90)} className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-300 hover:text-white text-xs font-medium">
                <RotateCw className="w-3.5 h-3.5" /> All +90°
              </button>
            </div>
          </div>

          {/* Loading first batch */}
          {pages.length === 0 && isLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">Loading pages…</span>
            </div>
          )}

          {/* Page grid */}
          {pages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {pages.map((page) => (
                <PageCard
                  key={page.index}
                  page={page}
                  rotation={rotations[page.index] ?? 0}
                  onLeft={() => rotate(page.index, -90)}
                  onRight={() => rotate(page.index, 90)}
                />
              ))}
            </div>
          )}

          {/* Sentinel for lazy loading */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {isLoading && pages.length > 0 && (
            <div className="flex justify-center py-6 text-zinc-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

        </motion.div>
      )}

      {/* Sticky download bar — always visible, never near the scroll sentinel */}
      {file && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-md border-t border-white/[0.08] px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 truncate">{file.name}</p>
            {hasAnyRotation
              ? <p className="text-xs text-white font-medium">{Object.values(rotations).filter(Boolean).length} page(s) rotated</p>
              : <p className="text-xs text-zinc-600">Rotate at least one page to download</p>
            }
          </div>

          <button
            onClick={handleReset}
            className="shrink-0 text-zinc-500 hover:text-white transition-colors text-xs underline underline-offset-4 whitespace-nowrap"
          >
            Change file
          </button>

          {isLocked ? (
            <UpgradeButton
              reason={paywallReason}
              limitLabel={`${ROTATE_LIMIT_MB} MB`}
              isWalletConnected={isConnected}
              isPremium={isPremium}
              className="shrink-0 h-11 px-5 text-sm"
            />
          ) : (
            <Button
              onClick={handleDownload}
              disabled={isProcessing || !hasAnyRotation || pages.length === 0}
              className="shrink-0 h-11 px-6 text-sm font-bold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl disabled:opacity-40"
            >
              {isProcessing
                ? <><Loader2 className="animate-spin mr-2 w-4 h-4" />Processing…</>
                : done
                ? <><CheckCircle2 className="mr-2 w-4 h-4 text-emerald-500" />Downloaded!</>
                : <><Download className="mr-2 w-4 h-4" />Apply &amp; Download</>
              }
            </Button>
          )}
        </div>
      )}
    </div>
  );
}