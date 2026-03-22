import React, { useState, useRef } from "react";
import { Layers, X, Download, Loader2, Trash2, GripVertical } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { mergePdfs } from "../../services/pdf.service";
import { Dropzone } from "../../components/pdf/Dropzone";
import { formatFileSize } from "../../utils/formatters";

export function Merge() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleFilesSelected = (selectedFiles) => {
    const validPdfs = selectedFiles.filter((file) => file.type === "application/pdf");
    if (validPdfs.length !== selectedFiles.length) {
      setError("Some files were ignored. Only PDF files are allowed.");
    } else {
      setError(null);
    }
    setFiles((prev) => [...prev, ...validPdfs]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError(null);
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _files = [...files];
    const draggedItemContent = _files.splice(dragItem.current, 1)[0];
    _files.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(_files);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    try {
      setIsProcessing(true);
      setError(null);
      const mergedPdfBlob = await mergePdfs(files);
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QuickPDF_Merged_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("An error occurred while merging the PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 text-white mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Merge PDF</h1>
        <p className="text-lg text-zinc-400">
          Combine multiple PDFs into a single file directly in your browser.
        </p>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <div className="mb-8">
          <Dropzone 
            onFilesSelected={handleFilesSelected} 
            multiple={true} 
            disabled={isProcessing} 
            text="Click to upload files" 
          />
        </div>

        {files.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">Selected Files ({files.length})</h3>
              <button 
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="flex items-center text-sm font-medium text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear All
              </button>
            </div>
            
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li 
                  key={`${file.name}-${index}`} 
                  draggable={!isProcessing}
                  onDragStart={() => (dragItem.current = index)}
                  onDragEnter={() => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex items-center justify-between p-3 bg-zinc-900/50 border border-white/10 rounded-lg group hover:border-white/30 transition-all ${isProcessing ? 'opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  <div className="flex items-center overflow-hidden mr-4">
                    <GripVertical className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors mr-3 flex-shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-zinc-200 truncate">{file.name}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-600 text-center mt-3 flex items-center justify-center">
              Drag and drop files to rearrange their order before merging.
            </p>
          </div>
        )}

        <div className="flex justify-end mt-8 border-t border-white/10 pt-6">
          <Button 
            onClick={handleMerge} 
            disabled={files.length < 2 || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Merge Files
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}