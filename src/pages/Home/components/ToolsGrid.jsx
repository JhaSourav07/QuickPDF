import React from "react";
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
  Unlock // Added the Unlock icon here
} from "lucide-react";

export function ToolsGrid() {
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto mb-32">
      {/* 1. Merge Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <Link
          to="/merge"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Merge PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Combine multiple PDFs into a single document in milliseconds. Drag,
            drop, and organize securely.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Merge Tool <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 2. Split Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.1 }}
      >
        <Link
          to="/split"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <SplitSquareHorizontal className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Split PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Extract specific pages or break a massive document down into smaller
            files instantly.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Split Tool <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 3. Watermark Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.2 }}
      >
        <Link
          to="/watermark"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Stamp className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Add Watermark
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Stamp custom text diagonally across your documents. Perfect for
            sensitive drafts and contracts.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Watermark Tool <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 4. Image to PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/image-to-pdf"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Image to PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Convert JPG and PNG images into a high-quality PDF document. Drag to
            reorder your pages.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Image to PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 5. Compress PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/compress"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Minimize2 className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Compress PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Reduce file size while maintaining visual quality.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Compress PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 6. Rotate PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/rotate"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <RefreshCw className="w-10 h-10" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Rotate PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Rotate pages in your PDF document.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Rotate PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 7. Organize PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/organize"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <LayoutGrid className="w-10 h-10" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Organize PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Organize pages in your PDF document.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Organize PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 8. PDF to Images Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/pdf-to-image"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Images className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            PDF to Images
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Extract images from your PDF document.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open PDF to Images <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 9. Grayscale Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/grayscale"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Contrast className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Grayscale PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Convert your PDF to grayscale.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Grayscale PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 10. Page Numbers Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.4 }}
      >
        <Link
          to="/page-numbers"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Hash className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Page Numbers
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Auto-stamp sequential numbers on every page footer. Choose position, prefix, and start number.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Page Numbers <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 11. Lock PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.4 }}
      >
        <Link
          to="/lock-pdf"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Lock PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Password-protect your PDF with RC4 encryption. Processed entirely in your browser — nothing is uploaded.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Lock PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 12. Edit PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.4 }}
      >
        <Link
          to="/edit-pdf"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <FileEdit className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Edit PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Draw, highlight, add text, and annotate your PDF pages directly in the browser.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open PDF Editor <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>

      {/* 13. Unlock PDF Card */}
      <Motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.5 }}
      >
        <Link
          to="/unlock-pdf"
          className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Unlock className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">
            Unlock PDF
          </h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Remove password security from your PDF documents for easier sharing and printing.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Unlock PDF <span className="ml-2">→</span>
          </div>
        </Link>
      </Motion.div>
    </div>
  );
}