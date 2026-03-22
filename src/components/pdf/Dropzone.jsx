import React, { useState, useRef } from 'react';
import { FilePlus } from 'lucide-react';

export function Dropzone({ onFilesSelected, multiple = false, disabled = false, text = "Click to upload" }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = null; 
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
        isDragging 
          ? 'border-white bg-white/5 scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
          : 'border-white/20 bg-zinc-900/30 hover:bg-zinc-900/80 hover:border-white/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
        <FilePlus className={`w-10 h-10 mb-4 transition-colors ${isDragging ? 'text-white' : 'text-zinc-500'}`} />
        <p className="mb-2 text-sm text-zinc-400 text-center px-4">
          <span className="font-semibold text-white">{text}</span> or drag and drop
        </p>
        <p className="text-xs text-zinc-600 uppercase tracking-widest mt-2">PDF Files Only</p>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={multiple}
        accept=".pdf,application/pdf"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}