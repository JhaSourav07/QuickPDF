import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Menu, X, LogOut, Crown, Copy, Check, Star, ChevronDown, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useTheme } from "../../hooks/useTheme";

function truncateAddr(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
        className="flex items-center gap-2 h-9 pl-3 pr-3.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all text-sm font-medium text-[var(--color-primary)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>

        {truncateAddr(address)}

        {isPremium && (
          <Crown className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">       
              <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-widest font-semibold mb-1">
                Connected wallet
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--color-primary)] truncate mr-2 opacity-80">
                  {truncateAddr(address)}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                  aria-label="Copy address"
                >
                  {copied
                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />        
                    : <Copy className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">Plan</span>
              {isPremium ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Crown className="w-3.5 h-3.5" /> Premium
                </span>
              ) : (
                <span className="text-xs text-[var(--color-primary)] opacity-60 font-medium">Free</span> 
              )}
            </div>

            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-muted)] hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Disconnect wallet
            </button>
          </Motion.div>
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
      <button className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap group">
        Edit
        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </Motion.div>
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
      <button className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap group">
        Convert
        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </Motion.div>
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
      <button className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap group">
        Optimize
        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </Motion.div>
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
      <button className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap group">
        Security
        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-44 bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-2">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="block px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-all"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const isPremium = false; // test // Mocking or getting from some other place if useSubscription is not found
  const { theme, toggleTheme } = useTheme();

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
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4 relative"> 

          <Link to="/" className="flex items-center gap-2 group z-50 shrink-0"> 
            <div className="bg-[var(--color-primary)] text-[var(--color-background)] p-1.5 rounded-md group-hover:scale-105 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[var(--color-primary)]">QuickPDF</span>
          </Link>

          {/* Desktop Navigation - 4 separate hover dropdowns */}
          <div className="hidden lg:flex gap-6 absolute left-1/2 transform -translate-x-1/2">
            <EditDropdown />
            <ConvertDropdown />
            <OptimizeDropdown />
            <SecurityDropdown />
          </div>

          <div className="flex items-center gap-3 shrink-0">

            {/* Light/Dark mode toggle button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              aria-label="Toggle light/dark mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <a
              href="https://github.com/JhaSourav07/QuickPDF"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] group"
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
              className="lg:hidden p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors z-50"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] rounded-xl transition-all"
                >
                  {link.name}
                </Link>
              ))}

              <a
                href="https://github.com/JhaSourav07/QuickPDF"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-3 text-base font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] rounded-xl transition-all"   
              >
                <Star className="w-4 h-4 text-amber-400" />
                Star us on GitHub
              </a>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
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
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
