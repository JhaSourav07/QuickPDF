import React, { useEffect, useState } from 'react';
import { motion as Motion } from 'framer-motion';

export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[var(--color-background)] overflow-hidden pointer-events-none transition-colors duration-300">
      {/* 1. The Fading Grid */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-primary) 1px, transparent 1px),' +
            'linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
        }}
      />

      {/* 2. The Interactive Mouse Spotlight */}
      <Motion.div
        className="absolute w-[800px] h-[800px] bg-[var(--color-primary)] opacity-[0.04] rounded-full blur-[100px]"
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.5 }}
      />

      {/* 3. Subtle Static Top Glow (anchors the page) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-[var(--color-muted)] opacity-[0.03] rounded-[100%] blur-[80px]" />
    </div>
  );
}
