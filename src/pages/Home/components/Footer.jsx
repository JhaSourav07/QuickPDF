import React from 'react';

export function Footer() {
  return (
    <footer className="w-full text-center py-8 border-t border-white/10 mt-auto">
      <p className="text-xs text-zinc-600">
        © {new Date().getFullYear()} QuickPDF. Built with privacy in mind.
      </p>
    </footer>
  );
}