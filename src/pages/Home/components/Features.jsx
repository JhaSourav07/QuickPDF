import React from 'react';
import { Zap, Shield, FileCheck } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export function Features() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: "Lightning Fast",
      description: "Uses your device's memory to process files instantly. No waiting in server queues."
    },
    {
      icon: <Shield className="w-6 h-6 text-white" />,
      title: "100% Private",
      description: "Your sensitive documents never leave your computer. We physically cannot see them."
    },
    {
      icon: <FileCheck className="w-6 h-6 text-white" />,
      title: "No Watermarks",
      description: "Export high-quality, pristine PDFs without any annoying branding attached."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="w-full max-w-5xl mx-auto border-t border-white/10 pt-24 mb-24">
      <Motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid md:grid-cols-3 gap-12 text-center md:text-left"
      >
        {features.map((feature, index) => (
          <Motion.div key={index} variants={itemVariants} className="flex flex-col items-center md:items-start group">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mb-6 group-hover:border-[var(--color-border-hover)] transition-colors duration-300">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-3">{feature.title}</h3>
            <p className="text-base text-[var(--color-muted)] leading-relaxed font-light">
              {feature.description}
            </p>
          </Motion.div>
        ))}
      </Motion.div>
    </div>
  );
}