import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useVisitorCount } from '../../../hooks/useVisitorCount';

const DIGIT_H = 48;
const DIGIT_W = 30;

// A single vertical reel — animates y to show the correct digit
function Reel({ digit, delay = 0 }) {
  return (
    <div className="relative overflow-hidden" style={{ width: DIGIT_W, height: DIGIT_H }}>
      {/* Top fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: '40%', background: 'linear-gradient(to bottom, #0a0a0a, transparent)' }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: '40%', background: 'linear-gradient(to top, #0a0a0a, transparent)' }}
      />
      <Motion.div
        animate={{ y: -digit * DIGIT_H }}
        transition={{ type: 'spring', stiffness: 160, damping: 22, delay }}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <div
            key={d}
            style={{
              height: DIGIT_H,
              width: DIGIT_W,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
              color: 'white',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
          >
            {d}
          </div>
        ))}
      </Motion.div>
    </div>
  );
}

function OdometerDisplay({ value }) {
  const formatted = value.toLocaleString('en-US'); // e.g. "1,247"
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {formatted.split('').map((char, i) =>
        char === ',' ? (
          <span
            key={i}
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: '#52525b', // zinc-600
              alignSelf: 'flex-end',
              marginBottom: 5,
              lineHeight: 1,
              marginLeft: -3,
              marginRight: -3,
            }}
          >
            ,
          </span>
        ) : (
          <Reel key={i} digit={parseInt(char)} />
        )
      )}
    </div>
  );
}

export function VisitorBadge() {
  const { count, loading, error } = useVisitorCount();

  return (
    <Motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.55 }}
      className="inline-flex flex-col items-center gap-3 px-10 py-5 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.03)] cursor-default select-none"
    >
      {/* Inset display panel */}
      <div
        className="flex items-center justify-center rounded-xl border border-white/[0.06] px-4"
        style={{ background: 'rgba(0,0,0,0.5)', minHeight: DIGIT_H + 16 }}
      >
        {loading ? (
          <span style={{ fontSize: 34, fontWeight: 800, color: '#3f3f46', letterSpacing: '-0.02em' }}>
            · · ·
          </span>
        ) : error ? (
          <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase px-2">
            unavailable
          </span>
        ) : (
          <OdometerDisplay value={count ?? 0} />
        )}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-white/10" />

      {/* Label */}
      <span className="text-[10px] font-semibold text-zinc-600 tracking-[0.2em] uppercase">
        people used QuickPDF
      </span>
    </Motion.div>
  );
}
