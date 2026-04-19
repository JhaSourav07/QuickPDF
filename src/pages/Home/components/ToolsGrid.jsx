import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";

export function ToolsGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 6; // Show 6 cards per page

  // All tools data
  const allTools = [
    {
      id: 1,
      name: "Merge PDF",
      description: "Combine multiple PDFs into a single document in milliseconds. Drag, drop, and organize securely.",
      icon: Layers,
      path: "/merge",
      buttonText: "Open Merge Tool",
      iconSize: "w-6 h-6"
    },
    {
      id: 2,
      name: "Split PDF",
      description: "Extract specific pages or break a massive document down into smaller files instantly.",
      icon: SplitSquareHorizontal,
      path: "/split",
      buttonText: "Open Split Tool",
      iconSize: "w-6 h-6"
    },
    {
      id: 3,
      name: "Add Watermark",
      description: "Stamp custom text diagonally across your documents. Perfect for sensitive drafts and contracts.",
      icon: Stamp,
      path: "/watermark",
      buttonText: "Open Watermark Tool",
      iconSize: "w-6 h-6"
    },
    {
      id: 4,
      name: "Image to PDF",
      description: "Convert JPG and PNG images into a high-quality PDF document. Drag to reorder your pages.",
      icon: ImageIcon,
      path: "/image-to-pdf",
      buttonText: "Open Image to PDF",
      iconSize: "w-6 h-6"
    },
    {
      id: 5,
      name: "Compress PDF",
      description: "Reduce file size while maintaining visual quality.",
      icon: Minimize2,
      path: "/compress",
      buttonText: "Open Compress PDF",
      iconSize: "w-6 h-6"
    },
    {
      id: 6,
      name: "Rotate PDF",
      description: "Rotate pages in your PDF document.",
      icon: RefreshCw,
      path: "/rotate",
      buttonText: "Open Rotate PDF",
      iconSize: "w-10 h-10"
    },
    {
      id: 7,
      name: "Organize PDF",
      description: "Organize pages in your PDF document.",
      icon: LayoutGrid,
      path: "/organize",
      buttonText: "Open Organize PDF",
      iconSize: "w-10 h-10"
    },
    {
      id: 8,
      name: "PDF to Images",
      description: "Extract images from your PDF document.",
      icon: Images,
      path: "/pdf-to-image",
      buttonText: "Open PDF to Images",
      iconSize: "w-6 h-6"
    },
    {
      id: 9,
      name: "Grayscale PDF",
      description: "Convert your PDF to grayscale.",
      icon: Contrast,
      path: "/grayscale",
      buttonText: "Open Grayscale PDF",
      iconSize: "w-6 h-6"
    },
    {
      id: 10,
      name: "Page Numbers",
      description: "Auto-stamp sequential numbers on every page footer. Choose position, prefix, and start number.",
      icon: Hash,
      path: "/page-numbers",
      buttonText: "Open Page Numbers",
      iconSize: "w-6 h-6"
    },
    {
      id: 11,
      name: "Lock PDF",
      description: "Password-protect your PDF with RC4 encryption. Processed entirely in your browser — nothing is uploaded.",
      icon: Lock,
      path: "/lock-pdf",
      buttonText: "Open Lock PDF",
      iconSize: "w-6 h-6"
    },
    {
      id: 12,
      name: "Edit PDF",
      description: "Draw, highlight, add text, and annotate your PDF pages directly in the browser.",
      icon: FileEdit,
      path: "/edit-pdf",
      buttonText: "Open PDF Editor",
      iconSize: "w-6 h-6"
    }
  ];

  // Calculate pagination
  const totalTools = allTools.length;
  const totalPages = Math.ceil(totalTools / toolsPerPage);
  const indexOfLastTool = currentPage * toolsPerPage;
  const indexOfFirstTool = indexOfLastTool - toolsPerPage;
  const currentTools = allTools.slice(indexOfFirstTool, indexOfLastTool);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Smooth scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  // Grid container variants for stagger animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
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

  return (
    <div className="w-full max-w-6xl mx-auto mb-32">
      {/* Tools Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {currentTools.map((tool, idx) => {
            const IconComponent = tool.icon;
            return (
              <motion.div
                key={tool.id}
                variants={cardVariants}
                custom={idx}
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
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Pagination Controls - Only show if more than 1 page */}
      {totalPages > 1 && (
        <>
          {/* Info text */}
          <div className="text-center text-zinc-500 text-sm mt-8 mb-6">
            Showing {indexOfFirstTool + 1}-{Math.min(indexOfLastTool, totalTools)} of {totalTools} tools
          </div>

          {/* Pagination Buttons */}
          <div className="flex justify-center items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === 1
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-105 active:scale-95'
              }`}
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2 mx-2">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-zinc-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                currentPage === totalPages
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-105 active:scale-95'
              }`}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}