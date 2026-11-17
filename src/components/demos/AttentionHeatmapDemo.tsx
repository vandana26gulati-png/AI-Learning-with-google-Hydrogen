import React, { useLayoutEffect, useRef, useState } from 'react';

interface SentenceScenario {
  label: string;
  words: string[];
  weights: number[][];
}

const SCENARIOS: SentenceScenario[] = [
  {
    label: 'Pronoun resolution',
    words: ['The', 'battery', 'died', 'because', 'it', 'was', 'old'],
    weights: [
      [0.48, 0.36, 0.06, 0.02, 0.03, 0.02, 0.03],
      [0.14, 0.44, 0.22, 0.04, 0.08, 0.03, 0.05],
      [0.05, 0.46, 0.30, 0.06, 0.05, 0.03, 0.05],
      [0.03, 0.12, 0.38, 0.26, 0.10, 0.04, 0.07],
      [0.04, 0.56, 0.12, 0.05, 0.14, 0.03, 0.06],
      [0.03, 0.20, 0.12, 0.06, 0.36, 0.14, 0.09],
      [0.03, 0.34, 0.10, 0.04, 0.24, 0.07, 0.18],
    ],
  },
  {
    label: 'Action & target',
    words: ['The', 'model', 'retrieves', 'fresh', 'facts', 'before', 'answering'],
    weights: [
      [0.50, 0.35, 0.05, 0.03, 0.03, 0.02, 0.02],
      [0.12, 0.48, 0.24, 0.04, 0.06, 0.03, 0.03],
      [0.03, 0.28, 0.34, 0.09, 0.20, 0.03, 0.03],
      [0.02, 0.06, 0.14, 0.36, 0.34, 0.04, 0.04],
      [0.02, 0.10, 0.30, 0.24, 0.28, 0.03, 0.03],
      [0.02, 0.08, 0.18, 0.06, 0.18, 0.28, 0.20],
      [0.02, 0.18, 0.24, 0.08, 0.30, 0.08, 0.10],
    ],
  },
];

export function AttentionHeatmapDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedWordIdx, setSelectedWordIdx] = useState(4); // starts on "it"
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [coords, setCoords] = useState<{ x: number; y: number }[]>([]);

  const scenario = SCENARIOS[scenarioIdx];
  const activeWeights = scenario.weights[selectedWordIdx] ?? scenario.weights[0];

  const measurePositions = () => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const nextCoords = scenario.words.map((_, i) => {
      const btn = buttonRefs.current[i];
      if (!btn) return { x: 0, y: 0 };
      const bRect = btn.getBoundingClientRect();
      return {
        x: bRect.left - cRect.left + bRect.width / 2,
        y: bRect.top - cRect.top + bRect.height / 2,
      };
    });
    setCoords(nextCoords);
  };

  useLayoutEffect(() => {
    measurePositions();
    window.addEventListener('resize', measurePositions);
    return () => window.removeEventListener('resize', measurePositions);
  }, [scenarioIdx, selectedWordIdx]);

  const origin = coords[selectedWordIdx];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Tap any word to see which context words it focuses on.{' '}
        <span className="text-amber-300">
          Illustrative hand-authored attention weights showing pronoun &amp; phrase linking.
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((sc, idx) => (
          <button
            key={sc.label}
            type="button"
            onClick={() => {
              setScenarioIdx(idx);
              setSelectedWordIdx(idx === 0 ? 4 : 6);
            }}
            className={`min-h-[36px] rounded-xl px-3 text-xs font-medium transition-colors ${
              scenarioIdx === idx
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/45'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Sentence stage with curved attention arcs */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-slate-800 bg-[#060913] px-3 pt-16 pb-5 overflow-hidden"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {origin &&
            coords.map((target, idx) => {
              const weight = activeWeights[idx] ?? 0;
              if (idx === selectedWordIdx || weight < 0.04) return null;
              const midX = (origin.x + target.x) * 0.5;
              const dist = Math.abs(origin.x - target.x);
              const arcY = Math.max(10, Math.min(origin.y, target.y) - 24 - dist * 0.16);
              return (
                <path
                  key={`arc-${idx}`}
                  d={`M ${origin.x} ${origin.y - 12} Q ${midX} ${arcY} ${target.x} ${target.y - 12}`}
                  fill="none"
                  stroke="#F59E0B"
                  strokeOpacity={Math.min(0.95, weight * 1.45)}
                  strokeWidth={1.2 + weight * 6}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              );
            })}
        </svg>

        <div className="relative z-10 flex flex-wrap justify-center gap-2">
          {scenario.words.map((word, idx) => {
            const weight = activeWeights[idx] ?? 0;
            const isSelected = idx === selectedWordIdx;
            return (
              <button
                key={`${word}-${idx}`}
                ref={(el) => {
                  buttonRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => setSelectedWordIdx(idx)}
                aria-pressed={isSelected}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(56, 189, 248, 0.25)'
                    : `rgba(245, 158, 11, ${Math.min(0.45, weight * 0.75)})`,
                }}
                className={`min-h-[40px] rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-cyan-400 text-white'
                    : 'border-slate-700/80 text-slate-100 hover:border-slate-500'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Attention weight breakdown bars */}
      <div className="space-y-1.5">
        <p className="text-xs text-slate-400">
          Attention weights from{' '}
          <span className="font-semibold text-cyan-300">
            “{scenario.words[selectedWordIdx]}”
          </span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scenario.words.map((word, idx) => {
            const pct = Math.round((activeWeights[idx] ?? 0) * 100);
            return (
              <div
                key={`bar-${word}-${idx}`}
                className="rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 truncate">{word}</span>
                  <span className="font-mono text-amber-300">{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
