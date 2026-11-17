import React, { useEffect, useState } from 'react';
import { useGalaxyStore } from '../store/galaxyStore';

export function LoadingOverlay() {
  const { prefersReducedMotion } = useGalaxyStore();
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDismissed(true);
      return;
    }
    const t1 = window.setTimeout(() => setFading(true), 480);
    const t2 = window.setTimeout(() => setDismissed(true), 1020);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [prefersReducedMotion]);

  if (dismissed) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040610] transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-purple-400/40 animate-ping" />
        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-400 to-teal-300 shadow-[0_0_28px_rgba(56,189,248,0.85)]" />
      </div>
      <p className="mt-4 font-display text-lg font-semibold tracking-wide text-slate-100">
        AI Concept Galaxy
      </p>
      <p className="mt-1 font-mono text-xs text-slate-400">
        Charting constellations...
      </p>
    </div>
  );
}
