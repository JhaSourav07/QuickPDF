import React, { useState, useRef, useCallback, useEffect } from "react";
import { useFileStore } from "../../hooks/useFileStore";
import {
  Layers, X, Download, Loader2, Trash2,
  Plus, CheckCircle2, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { mergePdfs } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// ─── helpers ─────────────────────────
let _uid = 0;
function makeId() { return ++_uid; }

async function renderFirstPage(file) {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport
    }).promise;

    const url = canvas.toDataURL("image/jpeg", 0.8);
    return { thumb: url };
  } catch {
    return { thumb: null };
  }
}

export function Merge() {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  // cleanup URL
  useEffect(() => {
    return () => {
      if (mergedPreviewUrl) {
        URL.revokeObjectURL(mergedPreviewUrl);
      }
    };
  }, [mergedPreviewUrl]);

  // add files
  const addFiles = useCallback(async (files) => {
    const valid = files.filter(f => f.type === "application/pdf");

    const newItems = valid.map(file => ({
      id: makeId(),
      file,
      name: file.name,
      thumb: null,
      loading: true
    }));

    setItems(prev => [...prev, ...newItems]);
    setMergedPreviewUrl(null);
    setDone(false);

    for (const item of newItems) {
      const { thumb } = await renderFirstPage(item.file);
      setItems(prev =>
        prev.map(it =>
          it.id === item.id ? { ...it, thumb, loading: false } : it
        )
      );
    }
  }, []);

  // merge
  const handleMerge = async () => {
    if (items.length < 2) return;

    setIsProcessing(true);
    setDone(false);

    try {
      const blob = await mergePdfs(items.map(i => i.file));
      const url = URL.createObjectURL(blob);

      setMergedPreviewUrl(url);
      setDone(true);
    } catch {
      alert("Error merging PDFs");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white">

      {/* Hidden Input */}
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

      <h1 className="text-3xl font-bold mb-6">Merge PDF</h1>

      {items.length === 0 ? (
        <Dropzone onFilesSelected={addFiles} multiple />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-white/10 rounded text-sm"
            >
              + Add more
            </button>

            <button
              onClick={() => {
                setItems([]);
                setMergedPreviewUrl(null);
              }}
              className="px-3 py-1 bg-red-500/20 rounded text-red-400 text-sm"
            >
              Clear all
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-800 p-2 rounded">
                {item.thumb ? (
                  <img src={item.thumb} alt="" />
                ) : (
                  <Loader2 className="animate-spin" />
                )}
                <p className="text-xs truncate">{item.name}</p>
              </div>
            ))}
          </div>

          {/* Drop more */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 p-6 text-center text-zinc-400 cursor-pointer mb-6"
          >
            + Drop more PDFs or click to add
          </div>
        </>
      )}

      {/* Button */}
      {items.length > 0 && (
        <Button onClick={handleMerge} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Generating...
            </>
          ) : done ? (
            <>
              <CheckCircle2 className="mr-2 text-green-500" />
              Preview Ready!
            </>
          ) : (
            <>
              <Download className="mr-2" />
              Generate Preview
            </>
          )}
        </Button>
      )}

      {/* Preview */}
      {mergedPreviewUrl && (
        <div className="mt-6">
          <iframe
            src={mergedPreviewUrl}
            className="w-full h-[400px] bg-white rounded"
          />

          <a href={mergedPreviewUrl} download="merged.pdf">
            <Button className="mt-3">
              <Download className="mr-2" />
              Download PDF
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}