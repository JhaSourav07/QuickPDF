import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ALL_TOOLS } from "../../../data/toolsData";

export function ToolsGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const toolsPerPage = 6;

  const totalTools = ALL_TOOLS.length;
  const totalPages = Math.ceil(totalTools / toolsPerPage);
  const indexOfLastTool = currentPage * toolsPerPage;
  const indexOfFirstTool = indexOfLastTool - toolsPerPage;
  const currentTools = ALL_TOOLS.slice(indexOfFirstTool, indexOfLastTool);

  const handlePageChange = (pageNumber) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);

    if (nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (idx) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: idx * 0.06,
      },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const getPageNumbers = () => {
    const pages = [];
    const ellipsisThreshold = 5;

    if (totalPages <= ellipsisThreshold) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }

      return pages;
    }

    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i += 1) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages);
      return pages;
    }

    if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    pages.push("...");
    for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-32">
      <AnimatePresence mode="wait">
        <Motion.div
          key={currentPage}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {currentTools.map((tool, idx) => {
            const IconComponent = tool.icon;

            return (
              <Motion.div key={tool.id} variants={cardVariants} custom={idx}>
                <Link
                  to={tool.path}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 text-left transition-all duration-500 hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative z-10 mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-white transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:text-black">
                    <IconComponent className={tool.iconSize} />
                  </div>
                  <h2 className="relative z-10 mb-3 text-2xl font-semibold tracking-tight text-white">
                    {tool.name}
                  </h2>
                  <p className="relative z-10 mb-8 flex-grow font-light leading-relaxed text-zinc-400">
                    {tool.description}
                  </p>
                  <div className="relative z-10 flex items-center text-sm font-medium text-white transition-transform duration-300 group-hover:translate-x-2">
                    {tool.buttonText} <span className="ml-2">{"->"}</span>
                  </div>
                </Link>
              </Motion.div>
            );
          })}
        </Motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <>
          <div className="mt-8 mb-6 text-center text-sm text-zinc-500">
            Showing {indexOfFirstTool + 1}-{Math.min(indexOfLastTool, totalTools)} of{" "}
            {totalTools} tools
          </div>

          <nav
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Tools pagination"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous tools page"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 sm:px-4 ${
                currentPage === 1
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50"
                  : "bg-zinc-800 text-white hover:scale-105 hover:bg-zinc-700 active:scale-95"
              }`}
            >
              <span aria-hidden="true">{"<-"}</span>
              <span>Previous</span>
            </button>

            <div className="mx-2 flex flex-wrap justify-center gap-2">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-zinc-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Go to tools page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 transition-all duration-300 sm:px-4 ${
                      currentPage === page
                        ? "scale-105 bg-white font-semibold text-black shadow-lg"
                        : "bg-zinc-800 text-zinc-300 hover:scale-105 hover:bg-zinc-700"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next tools page"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 sm:px-4 ${
                currentPage === totalPages
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50"
                  : "bg-zinc-800 text-white hover:scale-105 hover:bg-zinc-700 active:scale-95"
              }`}
            >
              <span>Next</span>
              <span aria-hidden="true">{"->"}</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
