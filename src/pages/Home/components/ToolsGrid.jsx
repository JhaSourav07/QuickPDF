import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from 'framer-motion';

import {
  Layers,
  SplitSquareHorizontal,
  Stamp,
  Image as ImageIcon,
  Minimize2,
  RefreshCw,
  LayoutGrid,
  Images,
  Contrast,
  Hash,
  Lock,
  FileEdit,
} from "lucide-react";

// FIX #1: Move tools data outside component to avoid recreation on every render
const TOOLS_DATA = [
  {
    id: 1,
    name: "Merge PDF",
    description: "Combine multiple PDFs into a single document in milliseconds. Drag, drop, and organize securely.",
    icon: Layers,
    path: "/merge",
    buttonText: "Open Merge Tool",
    iconSize: "w-6 h-6",
    delay: 0,
  },
  {
    id: 2,
    name: "Split PDF",
    description: "Extract specific pages or break a massive document down into smaller files instantly.",
    icon: SplitSquareHorizontal,
    path: "/split",
    buttonText: "Open Split Tool",
    iconSize: "w-6 h-6",
    delay: 0.1,
  },
  {
    id: 3,
    name: "Add Watermark",
    description: "Stamp custom text diagonally across your documents. Perfect for sensitive drafts and contracts.",
    icon: Stamp,
    path: "/watermark",
    buttonText: "Open Watermark Tool",
    iconSize: "w-6 h-6",
    delay: 0.2,
  },
  {
    id: 4,
    name: "Image to PDF",
    description: "Convert JPG and PNG images into a high-quality PDF document. Drag to reorder your pages.",
    icon: ImageIcon,
    path: "/image-to-pdf",
    buttonText: "Open Image to PDF",
    iconSize: "w-6 h-6",
    delay: 0.3,
  },
  {
    id: 5,
    name: "Compress PDF",
    description: "Reduce file size while maintaining visual quality.",
    icon: Minimize2,
    path: "/compress",
    buttonText: "Open Compress PDF",
    iconSize: "w-6 h-6",
    delay: 0.3,
  },
  {
    id: 6,
    name: "Rotate PDF",
    description: "Rotate pages in your PDF document.",
    icon: RefreshCw,
    path: "/rotate",
    buttonText: "Open Rotate PDF",
    iconSize: "w-10 h-10",
    delay: 0.3,
  },
  {
    id: 7,
    name: "Organize PDF",
    description: "Organize pages in your PDF document.",
    icon: LayoutGrid,
    path: "/organize",
    buttonText: "Open Organize PDF",
    iconSize: "w-10 h-10",
    delay: 0.3,
  },
  {
    id: 8,
    name: "PDF to Images",
    description: "Extract images from your PDF document.",
    icon: Images,
    path: "/pdf-to-image",
    buttonText: "Open PDF to Images",
    iconSize: "w-6 h-6",
    delay: 0.3,
  },
  {
    id: 9,
    name: "Grayscale PDF",
    description: "Convert your PDF to grayscale.",
    icon: Contrast,
    path: "/grayscale",
    buttonText: "Open Grayscale PDF",
    iconSize: "w-6 h-6",
    delay: 0.3,
  },
  {
    id: 10,
    name: "Page Numbers",
    description: "Auto-stamp sequential numbers on every page footer. Choose position, prefix, and start number.",
    icon: Hash,
    path: "/page-numbers",
    buttonText: "Open Page Numbers",
    iconSize: "w-6 h-6",
    delay: 0.4,
  },
  {
    id: 11,
    name: "Lock PDF",
    description: "Password-protect your PDF with RC4 encryption. Processed entirely in your browser — nothing is uploaded.",
    icon: Lock,
    path: "/lock-pdf",
    buttonText: "Open Lock PDF",
    iconSize: "w-6 h-6",
    delay: 0.4,
  },
  {
    id: 12,
    name: "Edit PDF",
    description: "Draw, highlight, add text, and annotate your PDF pages directly in the browser.",
    icon: FileEdit,
    path: "/edit-pdf",
    buttonText: "Open PDF Editor",
    iconSize: "w-6 h-6",
    delay: 0.4,
  },
];

export function ToolsGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 6;
  const totalPages = Math.ceil(TOOLS_DATA.length / toolsPerPage);

  // FIX #4: Convert cardVariants to a function to use the custom prop for per-card delays
  const cardVariants = (delay) => ({
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20, delay },
    },
  });

  // FIX #3: Rename maxVisible to switchThreshold to clarify its purpose
  const getPageNumbers = () => {
    const pages = [];
    const switchThreshold = 5; // Threshold for switching to ellipsis layout

    if (totalPages <= switchThreshold) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startIdx = (currentPage - 1) * toolsPerPage;
  const endIdx = startIdx + toolsPerPage;
  const currentTools = TOOLS_DATA.slice(startIdx, endIdx);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Tools Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
        {currentTools.map((tool, idx) => {
          const IconComponent = tool.icon;
          return (
            <Motion.div
              key={tool.id}
              variants={cardVariants(tool.delay)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <Link
                to={tool.path}
                className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
                  <IconComponent className={tool.iconSize} />
                </div>
                <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
                  {tool.name}
                </h2>
                <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
                  {tool.description}
                </p>
                <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
                  {tool.buttonText} <span className="ml-2">→</span>
                </div>
              </Link>
            </Motion.div>
          );
        })}
      </div>

      {/* FIX #5: Add responsive pagination controls with flex-wrap and responsive padding */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 w-full max-w-6xl mx-auto mb-32">
          <div className="flex flex-wrap justify-center items-center gap-2 px-2 sm:px-4">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                currentPage === 1
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-105 active:scale-95'
              }`}
            >
              ← Prev
            </button>

            {/* Page Numbers */}
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-zinc-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                      currentPage === page
                        ? 'bg-white text-black font-semibold shadow-lg scale-105'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:scale-105'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                currentPage === totalPages
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-105 active:scale-95'
              }`}
            >
              Next →
            </button>
          </div>

          {/* Page Info */}
          <div className="text-zinc-400 text-sm">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}