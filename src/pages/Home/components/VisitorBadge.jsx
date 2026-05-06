import React from 'react';
import { UserCheck } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useVisitorCount } from '../../../hooks/useVisitorCount';

/**
 * Formats a number with commas, e.g. 12345 → "12,345"
 */
function formatCount(n) {
  if (n === null) return '···';
  return n.toLocaleString('en-US');
}

/**
 * Animated counter that rolls digits up from 0 to the target value.
 */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (value === null) return;

    const duration = 1800; // ms
    const startTime = performance.now();
    const startVal = display;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(startVal + (value - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{formatCount(display)}</span>;
}

export function VisitorBadge() {
  const { count, loading, error } = useVisitorCount();

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-xl hover:bg-white/10 transition-colors duration-300 cursor-default select-none"
    >
      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />

      <span className="text-xs font-mono text-zinc-300 tracking-wide">
        {loading ? (
          <span className="opacity-40">loading…</span>
        ) : error ? (
          <span className="text-zinc-500">stats unavailable</span>
        ) : (
          <>
            <AnimatedNumber value={count} />
            <span className="text-zinc-500 ml-1">people used QuickPDF</span>
          </>
        )}
      </span>
    </Motion.div>
  );
}

