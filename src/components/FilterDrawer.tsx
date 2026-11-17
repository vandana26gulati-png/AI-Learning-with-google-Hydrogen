import React from 'react';
import { X } from 'lucide-react';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';
import type { TermLevel } from '../types/galaxy';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
}

const LEVELS: { id: TermLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export function FilterDrawer({ open, onClose }: FilterDrawerProps) {
  const {
    activeClusterIds,
    toggleClusterFilter,
    activeLevels,
    toggleLevelFilter,
    clearAllFilters,
    hasActiveFilters,
    matchingTermIds,
    prefersReducedMotion,
    reducedMotionOverride,
    setReducedMotionOverride,
  } = useGalaxyStore();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Filter concepts and motion settings"
      className="fixed top-16 right-3 left-3 sm:left-auto sm:right-5 z-30 sm:w-[440px] max-h-[75vh] overflow-y-auto galaxy-scroll rounded-2xl border border-slate-800/90 bg-[#0B1120]/95 p-4 sm:p-5 backdrop-blur-md shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Filter Constellation
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {matchingTermIds.size} of {galaxyData.terms.length} terms visible
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="h-9 px-3 rounded-lg text-xs font-medium text-cyan-300 hover:bg-cyan-500/15 transition-colors whitespace-nowrap"
            >
              Reset all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Difficulty Level */}
      <div className="py-4 border-b border-slate-800/80">
        <p className="text-xs font-medium text-slate-400 mb-2.5">Difficulty level</p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((lvl) => {
            const active = activeLevels.has(lvl.id);
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => toggleLevelFilter(lvl.id)}
                aria-pressed={active}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clusters */}
      <div className="py-4 border-b border-slate-800/80">
        <p className="text-xs font-medium text-slate-400 mb-2.5">Clusters (12 constellations)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {galaxyData.clusters.map((cluster) => {
            const active = activeClusterIds.has(cluster.id);
            const count = galaxyData.terms.filter((t) => t.cluster === cluster.id).length;
            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => toggleClusterFilter(cluster.id)}
                aria-pressed={active}
                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  active
                    ? 'bg-slate-800 text-white border border-slate-600'
                    : 'bg-slate-900/60 text-slate-300 border border-slate-800/80 hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-mono text-sm shrink-0"
                    style={{ color: cluster.color }}
                    aria-hidden="true"
                  >
                    {cluster.symbol}
                  </span>
                  <span className="truncate font-medium">{cluster.shortName}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">
                  {count}/{cluster.targetCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reduced motion accessibility setting */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-200">Reduce star drift & camera motion</p>
          <p className="text-[11px] text-slate-400">
            Freezes star drift and uses instant camera jumps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReducedMotionOverride(!prefersReducedMotion)}
          aria-pressed={prefersReducedMotion}
          className={`min-h-[40px] px-3.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            prefersReducedMotion
              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
          }`}
        >
          {prefersReducedMotion ? 'Reduced' : 'Standard'}
        </button>
      </div>
      {reducedMotionOverride !== null && (
        <button
          type="button"
          onClick={() => setReducedMotionOverride(null)}
          className="mt-2 text-[11px] text-slate-400 underline hover:text-slate-200"
        >
          Restore OS motion default
        </button>
      )}
    </div>
  );
}
