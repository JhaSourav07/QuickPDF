import React from "react";
import { X, FileText, Loader2, Download, CheckCircle2, PackageOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";
import { formatFileSize } from "../../utils/formatters";

/**
 * Reusable batch mode panel.
 *
 * Props:
 *  batchFiles, addFiles, removeFile, clearFiles
 *  isProcessing, progress, error, done
 *  onRun        — called when user clicks "Process & Download ZIP"
 *  runLabel     — button label override (default "Process All & Download ZIP")
 *  previewUrl   — optional: URL of first-file preview (iframe)
 *  accept       — file input accept string (default "application/pdf")
 */
export function BatchPanel({
  batchFiles,
  addFiles,
  removeFile,
  isProcessing,
  progress,
  error,
  done,
  onRun,
  runLabel = "Process All & Download ZIP",
  previewUrl,
  accept = "application/pdf",
}) {
  function handleDrop(e) {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  }

  function handleInput(e) {
    addFiles(Array.from(e.target.files));
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-white/25 hover:bg-white/[0.02] transition-all"
      >
        <PackageOpen className="w-8 h-8 text-zinc-600 mb-2" />
        <span className="text-sm text-zinc-500">
          Drop PDFs here or <span className="text-white underline underline-offset-2">browse</span>
        </span>
        <span className="text-xs text-zinc-700 mt-1">Multiple files supported</span>
        <input
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleInput}
          disabled={isProcessing}
        />
      </label>

      {/* File list */}
      <AnimatePresence initial={false}>
        {batchFiles.map((file, i) => (
          <motion.div
            key={`${file.name}-${file.size}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-white/[0.06] rounded-xl">
              <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{file.name}</p>
                <p className="text-xs text-zinc-600">{formatFileSize(file.size)}</p>
              </div>
              {/* Only show preview badge for first file */}
              {i === 0 && previewUrl && (
                <span className="text-[10px] text-zinc-500 border border-white/10 rounded px-1.5 py-0.5 shrink-0">
                  preview
                </span>
              )}
              <button
                onClick={() => removeFile(i)}
                disabled={isProcessing}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* First-file preview */}
      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <p className="text-xs text-zinc-600 px-3 py-2 border-b border-white/[0.06]">
            Preview — first file only
          </p>
          <iframe
            src={previewUrl}
            title="Batch preview"
            className="w-full bg-white"
            style={{ height: "clamp(240px, 40vh, 480px)" }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20">
          {error}
        </div>
      )}

      {/* Progress */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing {progress.current} of {progress.total}…
                </span>
                <span className="text-zinc-500 text-xs">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-white h-1.5 rounded-full"
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      {batchFiles.length > 0 && (
        <Button
          onClick={onRun}
          disabled={isProcessing || batchFiles.length === 0}
          className="w-full h-12"
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
          ) : done ? (
            <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />Downloaded!</>
          ) : (
            <><Download className="w-4 h-4 mr-2" />{runLabel} ({batchFiles.length} file{batchFiles.length > 1 ? "s" : ""})</>
          )}
        </Button>
      )}
    </div>
  );
}
