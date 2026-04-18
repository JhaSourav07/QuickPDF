import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Menu, X, LogOut, Crown, Copy, Check, Star, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSubscription } from "../../hooks/useSubscription";

function truncate(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletMenu({ address, isPremium }) {
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-white"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>

        {truncate(address)}

        {isPremium && (
          <Crown className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-1">
                Connected wallet
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-300 truncate mr-2">
                  {truncate(address)}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-zinc-500 hover:text-white transition-colors"
                  aria-label="Copy address"
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                    : <Copy className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-zinc-500">Plan</span>
              {isPremium ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Crown className="w-3.5 h-3.5" /> Premium
                </span>
              ) : (
                <span className="text-xs text-zinc-400 font-medium">Free</span>
              )}
            </div>

            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Disconnect wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Edit Dropdown Component
function EditDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tools = [
    { name: "Merge", path: "/merge" },
    { name: "Split", path: "/split" },
    { name: "Rotate", path: "/rotate" },
    { name: "Page Numbers", path: "/page-numbers" },
  ];

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap group">
        Edit
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[#0a0a0a] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Convert Dropdown Component
function ConvertDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tools = [
    { name: "Image To PDF", path: "/image-to-pdf" },
    { name: "PDF To Image", path: "/pdf-to-image" },
  ];

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap group">
        Convert
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[#0a0a0a] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Optimize Dropdown Component
function OptimizeDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tools = [
    { name: "Compress", path: "/compress" },
    { name: "Grayscale", path: "/grayscale" },
  ];

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap group">
        Optimize
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[#0a0a0a] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Security Dropdown Component
function SecurityDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tools = [
    { name: "Watermark", path: "/watermark" },
  ];

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap group">
        Security
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[#0a0a0a] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { isPremium } = useSubscription();

  const navLinks = [
    { name: "Merge", path: "/merge" },
    { name: "Split", path: "/split" },
    { name: "Watermark", path: "/watermark" },
    { name: "Image To PDF", path: "/image-to-pdf" },
    { name: "Compress", path: "/compress" },
    { name: "Rotate", path: "/rotate" },
    { name: "Organize", path: "/organize" },
    { name: "PDF To Image", path: "/pdf-to-image" },
    { name: "Grayscale", path: "/grayscale" },
    { name: "Page Numbers", path: "/page-numbers" },
  ];

  return (
    <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4 relative">

          <Link to="/" className="flex items-center gap-2 group z-50 shrink-0">
            <div className="bg-white text-black p-1.5 rounded-md group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">QuickPDF</span>
          </Link>

          {/* Desktop Navigation - 4 separate hover dropdowns */}
          <div className="hidden lg:flex gap-6 absolute left-1/2 transform -translate-x-1/2">
            <EditDropdown />
            <ConvertDropdown />
            <OptimizeDropdown />
            <SecurityDropdown />
          </div>

          <div className="flex items-center gap-3 shrink-0">

            <a
              href="https://github.com/JhaSourav07/QuickPDF"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all text-sm font-medium text-zinc-300 hover:text-white group"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 group-hover:fill-amber-400 transition-all" />
              Star us
            </a>

            {isConnected && address ? (
              <WalletMenu address={address} isPremium={isPremium} />
            ) : (
              <div className="hidden sm:block">
                <ConnectButton
                  accountStatus="hidden"
                  chainStatus="none"
                  showBalance={false}
                  label="Connect Wallet"
                />
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors z-50"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-b border-white/10 bg-[#0a0a0a] overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {link.name}
                </Link>
              ))}

              <a
                href="https://github.com/JhaSourav07/QuickPDF"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-3 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <Star className="w-4 h-4 text-amber-400" />
                Star us on GitHub
              </a>

              <div className="pt-3 mt-3 border-t border-white/10">
                {isConnected && address ? (
                  <WalletMenu address={address} isPremium={isPremium} />
                ) : (
                  <ConnectButton
                    accountStatus="hidden"
                    chainStatus="none"
                    showBalance={false}
                    label="Connect Wallet"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}