import React, { useEffect, useState } from 'react';


export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track the mouse moving across the entire window
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
      
      {/* 1. The Fading Grid */}
      <div 
        className="absolute inset-0 opacity-[0.1]"
        style={{
          // Creates a perfect square grid
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          // Fades the grid out at the edges of the screen
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
        }}
      />

      {/* 2. The Interactive Mouse Spotlight */}
      <Motion.div
        className="absolute w-[800px] h-[800px] bg-white/[0.04] rounded-full blur-[100px]"
        // The x and y subtract half the width/height (400px) so the cursor is perfectly in the center of the glow
        animate={{
          x: mousePosition.x - 400, 
          y: mousePosition.y - 400,
        }}
        // "tween" with "easeOut" makes it follow the mouse with a slight, buttery-smooth delay
        transition={{ type: "tween", ease: "easeOut", duration: 0.5 }}
      />
      
      {/* 3. Subtle Static Top Glow (anchors the page) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-zinc-400/[0.03] rounded-[100%] blur-[80px]" />
      
    </div>
  );
}