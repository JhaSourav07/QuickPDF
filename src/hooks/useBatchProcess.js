import { useState, useCallback } from "react";
import JSZip from "jszip";

/**
 * Reusable batch processing hook.
 *
 * @param {Function} processFn  - async (file, options) => Blob
 * @param {Function} getOutputName - (originalName) => string
 */
export function useBatchProcess(processFn, getOutputName) {
  const [isBatchMode, setIsBatchMode]   = useState(false);
  const [batchFiles, setBatchFiles]     = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [error, setError]               = useState(null);
  const [done, setDone]                 = useState(false);

  const addFiles = useCallback((incoming) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) { setError("Please upload valid PDF files."); return; }
    setError(null);
    setDone(false);
    setBatchFiles((prev) => {
      // deduplicate by name+size
      const existing = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const fresh = pdfs.filter((f) => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...fresh];
    });
  }, []);

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
   * Processes one file at a time to avoid memory spikes.
   */
  const runBatch = useCallback(async (options = {}) => {
    if (batchFiles.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setDone(false);
    setProgress({ current: 0, total: batchFiles.length });

    const zip = new JSZip();

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        setProgress({ current: i + 1, total: batchFiles.length });

        // Give the browser and any WASM workers time to reset between files
        await new Promise((r) => setTimeout(r, 150));

        const blob = await processFn(file, options);
        const outputName = getOutputName(file.name);
        zip.file(outputName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QuickPDF_Batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("One or more files failed to process. They may be encrypted or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  }, [batchFiles, processFn, getOutputName]);

  return {
    isBatchMode, setIsBatchMode,
    batchFiles, addFiles, removeFile, clearFiles,
    isProcessing, progress, error, done,
    runBatch,
  };
}
