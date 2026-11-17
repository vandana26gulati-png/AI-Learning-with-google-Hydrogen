import React from 'react';
import { Play, X } from 'lucide-react';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';

interface JourneysMenuProps {
  open: boolean;
  onClose: () => void;
}

export function JourneysMenu({ open, onClose }: JourneysMenuProps) {
  const { startJourney, activeJourneyId } = useGalaxyStore();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Guided learning journeys"
      className="fixed top-16 right-3 left-3 sm:left-auto sm:right-5 z-30 sm:w-[400px] rounded-2xl border border-slate-800/90 bg-[#0B1120]/95 p-4 sm:p-5 backdrop-blur-md shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Guided Journeys
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Animated paths across key concepts
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close journeys menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {galaxyData.journeys.map((journey) => {
          const isActive = activeJourneyId === journey.id;
          return (
            <button
              key={journey.id}
              type="button"
              onClick={() => {
                startJourney(journey.id);
                onClose();
              }}
              className={`w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                isActive
                  ? 'border-amber-500/50 bg-amber-500/12'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-slate-100">
                  {journey.title}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-300 shrink-0">
                  <Play className="h-3 w-3" aria-hidden="true" />
                  {journey.steps.length} stops
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {journey.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
