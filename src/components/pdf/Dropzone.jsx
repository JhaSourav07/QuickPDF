import React, { useState, useRef } from "react";
import { FilePlus } from "lucide-react";

export function Dropzone({
  onFilesSelected,
  multiple = false,
  disabled = false,
  text = "Click to upload",
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Prevent default browser behavior of opening the file
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
      // Pass the raw files array back up to the parent component
      onFilesSelected(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = null; // Reset input so the same file can be selected again if needed
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-primary bg-blue-50 scale-[1.02]"
          : "border-slate-300 bg-slate-50 hover:bg-slate-100"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
        <FilePlus
          className={`w-10 h-10 mb-3 transition-colors ${isDragging ? "text-primary" : "text-slate-400"}`}
        />
        <p className="mb-2 text-sm text-slate-600 text-center px-4">
          <span className="font-semibold text-primary">{text}</span> or drag and
          drop
        </p>
        <p className="text-xs text-slate-500">Only PDF files are supported</p>
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
