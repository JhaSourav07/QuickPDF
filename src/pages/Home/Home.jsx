import React from 'react';
import { Hero } from './components/Hero';
import { ToolsGrid } from './components/ToolsGrid';
import { Features } from './components/Features';
import { Footer } from './components/Footer';

export function Home() {
  return (
    <div className="relative flex flex-col items-center w-full min-h-screen selection:bg-white/20">
      <div className="relative z-10 w-full px-4 sm:px-6 flex-grow flex flex-col items-center">
        <Hero />
        <ToolsGrid />
        <Features />
      </div>
      
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
}