import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, SplitSquareHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export function ToolsGrid() {
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-32">
      
      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, margin: "-50px" }}
      >
        <Link to="/merge" className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden">
          {/* Subtle hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">Merge PDF</h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Combine multiple PDFs into a single document in milliseconds. Drag, drop, and organize securely.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Merge Tool <span className="ml-2">→</span>
          </div>
        </Link>
      </motion.div>

      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.1 }} // Slight delay so the right card loads after the left
      >
        <Link to="/split" className="group flex flex-col p-8 bg-[#0a0a0a] border border-white/10 rounded-3xl hover:border-white/30 hover:bg-white/[0.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-500 text-left h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 w-14 h-14 border border-white/10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
            <SplitSquareHorizontal className="w-6 h-6" />
          </div>
          <h2 className="relative z-10 text-2xl font-semibold text-white mb-3 tracking-tight">Split PDF</h2>
          <p className="relative z-10 text-zinc-400 mb-8 font-light flex-grow leading-relaxed">
            Extract specific pages or break a massive document down into smaller files instantly.
          </p>
          <div className="relative z-10 flex items-center text-sm font-medium text-white group-hover:translate-x-2 transition-transform duration-300">
            Open Split Tool <span className="ml-2">→</span>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}