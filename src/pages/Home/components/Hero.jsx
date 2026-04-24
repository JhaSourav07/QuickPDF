import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative text-center mb-24 pt-20 pb-10 w-full flex flex-col items-center justify-center">
      
      
      <Motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 space-y-8"
      >
        <Motion.div variants={item}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-xs font-mono uppercase tracking-widest backdrop-blur-md hover:bg-white/10 transition-colors cursor-default shadow-xl">
            <ShieldCheck className="w-4 h-4 text-white" />
            Client-Side Processing
          </div>
        </Motion.div>

        <Motion.h1 
          variants={item}
          className="text-6xl md:text-8xl font-extrabold text-white tracking-tighter leading-[1.1]"
        >
          smart PDF tools that <br className="hidden md:block" />
          help everyone <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">easily.</span>
        </Motion.h1>

        <Motion.p 
          variants={item}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
        >
          Merge and split your files directly in the browser. <br className="hidden sm:block" />
          No backend. No uploads. Zero risk of data leaks.
        </Motion.p>
      </Motion.div>
    </div>
  );
}