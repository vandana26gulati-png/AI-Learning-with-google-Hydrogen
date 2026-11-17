import React from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';

export function JourneyBar() {
  const {
    activeJourneyId,
    journeyStepIndex,
    journeyPlaying,
    setJourneyPlaying,
    stepJourney,
    goToJourneyStep,
    stopJourney,
    selectedTermId,
  } = useGalaxyStore();

  if (!activeJourneyId) return null;

  const journey = galaxyData.journeys.find((j) => j.id === activeJourneyId);
  if (!journey || journey.steps.length === 0) return null;

  const currentStep = journey.steps[journeyStepIndex] ?? journey.steps[0];
  const currentTerm = galaxyData.termMap.get(currentStep.termId);

  return (
    <aside
      aria-label={`Guided journey: ${journey.title}`}
      className={`pointer-events-auto fixed z-25 left-3 right-3 sm:left-4 sm:right-auto sm:w-[420px] rounded-2xl border border-slate-700/80 bg-[#0B1120]/94 p-3.5 sm:p-4 backdrop-blur-md shadow-2xl transition-all duration-200 ${
        selectedTermId ? 'bottom-[52vh] sm:bottom-16' : 'bottom-4 sm:bottom-16'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <span>Guided Journey</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              {journeyStepIndex + 1} / {journey.steps.length}
            </span>
          </div>
          <h3 className="font-display text-sm sm:text-base font-semibold text-slate-50 truncate mt-0.5">
            {journey.title}: {currentTerm?.term}
          </h3>
        </div>
        <button
          type="button"
          onClick={stopJourney}
          aria-label="Exit guided journey"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
        {currentStep.caption}
      </p>

      {/* Step progress dots */}
      <div className="mt-3 flex items-center gap-1.5" role="tablist" aria-label="Journey steps">
        {journey.steps.map((step, idx) => {
          const isCurrent = idx === journeyStepIndex;
          const isDone = idx < journeyStepIndex;
          const term = galaxyData.termMap.get(step.termId);
          return (
            <button
              key={step.termId}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Step ${idx + 1}: ${term?.term ?? step.termId}`}
              onClick={() => {
                setJourneyPlaying(false);
                goToJourneyStep(idx);
              }}
              className={`h-2 flex-1 rounded-full transition-colors ${
                isCurrent
                  ? 'bg-amber-400'
                  : isDone
                    ? 'bg-cyan-400/75'
                    : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setJourneyPlaying(false);
            stepJourney(-1);
          }}
          disabled={journeyStepIndex === 0}
          className="flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-xs font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => setJourneyPlaying(!journeyPlaying)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 text-xs font-medium text-amber-200 hover:bg-amber-500/30"
        >
          {journeyPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setJourneyPlaying(false);
            stepJourney(1);
          }}
          disabled={journeyStepIndex >= journey.steps.length - 1}
          className="flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-xs font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-800"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
