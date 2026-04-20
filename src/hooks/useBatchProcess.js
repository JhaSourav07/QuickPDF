import { useState, useCallback } from "react";
import JSZip from "jszip";

/**
 * Reusable batch processing hook.
 *
 * @param {Function} processFn      - async (file, options) => Blob
 * @param {Function} getOutputName  - (originalName) => string
 * @param {Object}   guards         - optional { canProcess(file) => bool, onAfterEach() => Promise }
 *   canProcess  — called before each file; return false to skip (e.g. size/global limit check)
 *   onAfterEach — called after each successful file (e.g. incrementUsage)
 */
export function useBatchProcess(processFn, getOutputName, guards = {}) {
  const [isBatchMode, setIsBatchMode]   = useState(false);
  const [batchFiles, setBatchFiles]     = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [error, setError]               = useState(null);
  const [done, setDone]                 = useState(false);

  const addFiles = useCallback((incoming) => {
    if (isProcessing) return; // ignore drops mid-run
    const pdfs = incoming.filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) { setError("Please upload valid PDF files."); return; }
    setError(null);
    setDone(false);
    setBatchFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const fresh = pdfs.filter((f) => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...fresh];
    });
  }, [isProcessing]);

  const removeFile = useCallback((index) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
    setDone(false);
  }, []);

  const clearFiles = useCallback(() => {
    setBatchFiles([]);
    setDone(false);
    setError(null);
    setProgress({ current: 0, total: 0 });
  }, []);

  /**
   * Process all files with the given options and download as ZIP.
   * Respects canProcess guard and calls onAfterEach per file.
   */
  const runBatch = useCallback(async (options = {}) => {
    if (batchFiles.length === 0) return;

    // Check global guard before starting
    if (guards.canProcess && !guards.canProcess(batchFiles[0])) {
      setError("You have reached your free-tier limit. Upgrade to continue.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDone(false);
    setProgress({ current: 0, total: batchFiles.length });

    const zip = new JSZip();

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        setProgress({ current: i + 1, total: batchFiles.length });

        // Per-file guard (size limit etc.)
        if (guards.canProcess && !guards.canProcess(file)) {
          setError(`"${file.name}" exceeds the free-tier size limit and was skipped.`);
          continue;
        }

        // Yield to event loop — keeps UI responsive and lets WASM workers reset
        await new Promise((r) => setTimeout(r, 150));

        const blob = await processFn(file, options);
        zip.file(getOutputName(file.name), blob);

        // Increment usage per file
        if (guards.onAfterEach) await guards.onAfterEach();
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QuickPDF_Batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after next tick so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("One or more files failed to process. They may be encrypted or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  }, [batchFiles, processFn, getOutputName, guards]);

  return {
    isBatchMode, setIsBatchMode,
    batchFiles, addFiles, removeFile, clearFiles,
    isProcessing, progress, error, done,
    runBatch,
  };
}
