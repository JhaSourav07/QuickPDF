import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-white text-black p-1.5 rounded-md group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              QuickPDF
            </span>
          </Link>

          <div className="flex gap-6">
            <Link
              to="/merge"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Merge
            </Link>
            <Link
              to="/split"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Split
            </Link>
            <Link
              to="/watermark"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Watermark
            </Link>
            <Link
              to="/image-to-pdf"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Image To PDF
            </Link>
            <Link
              to="/compress"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Compress
            </Link>
            <Link
              to="/rotate"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Rotate
            </Link>
            <Link
              to="/organize"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Organize
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
