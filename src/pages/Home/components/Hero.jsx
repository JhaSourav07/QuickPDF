import React from 'react';
import { ShieldCheck, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
  };

  const floatingIcon = {
    y: [0, -10, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  };

  return (
    <div className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl opacity-0 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/20 rounded-full filter blur-3xl opacity-0 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl opacity-0 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Main content */}
      <Motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center space-y-8 px-4 max-w-5xl"
      >
        {/* Badge */}
        <Motion.div variants={item}>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium backdrop-blur-md hover:border-cyan-400/60 hover:bg-cyan-500/20 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Next-Gen PDF Processing</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-60" />
          </div>
        </Motion.div>

        {/* Main heading with enhanced gradient */}
        <Motion.div variants={item} className="space-y-4">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-tighter leading-[0.95] !my-0">
            Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 animate-pulse-slow">
              PDF Workflow
            </span>
            Instantly
          </h1>
        </Motion.div>

        {/* Subtitle with better formatting */}
        <Motion.p 
          variants={item}
          className="text-base sm:text-lg lg:text-xl text-zinc-300/80 max-w-3xl mx-auto font-light leading-relaxed"
        >
          Experience lightning-fast PDF tools that work entirely in your browser. 
          <span className="block text-zinc-400 mt-2">
            No servers. No data uploads. Just pure, client-side magic. ✨
          </span>
        </Motion.p>

        {/* Feature highlights */}
        <Motion.div 
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span>100% Private</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-zinc-600"></div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span>Blazingly Fast</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-zinc-600"></div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="w-5 h-5 text-blue-400 flex-shrink-0 font-bold">∞</span>
            <span>No Limits</span>
          </div>
        </Motion.div>

        {/* CTA Buttons */}
        <Motion.div 
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
        >
          <button className="group relative px-8 py-4 rounded-lg font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:from-cyan-400 group-hover:to-blue-500 transition-all"></div>
            <div className="relative flex items-center gap-2">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
          <button className="px-8 py-4 rounded-lg font-semibold text-white border border-zinc-600 hover:border-zinc-400 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
            Learn More
          </button>
        </Motion.div>
      </Motion.div>

      {/* Scroll indicator */}
      <Motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-zinc-600 rounded-full animate-pulse"></div>
        </div>
      </Motion.div>
    </div>
  );
}