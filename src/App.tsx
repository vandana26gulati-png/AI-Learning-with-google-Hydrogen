import React, { useEffect, useState } from 'react';
import { EyeOff, Sparkles, X } from 'lucide-react';
import { ControlsDrawer } from './components/ControlsDrawer';
import { FilterDrawer } from './components/FilterDrawer';
import { GalaxyCanvas } from './components/GalaxyCanvas';
import { JourneyBar } from './components/JourneyBar';
import { JourneysMenu } from './components/JourneysMenu';
import { ListView } from './components/ListView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { TermPanel } from './components/TermPanel';
import { TopBar } from './components/TopBar';
import { DemoModal } from './components/demos/DemoModal';
import { HIDDEN_DISCOVERIES } from './data/discoveries';
import { GalaxyProvider, useGalaxyStore } from './store/galaxyStore';

function GalaxyShell() {
  const {
    viewMode,
    selectedTermId,
    selectTerm,
    activeJourneyId,
    openDemoId,
    setOpenDemoId,
    photoMode,
    setPhotoMode,
    latestDiscovery,
    clearLatestDiscovery,
    discoveredIds,
  } = useGalaxyStore();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [journeysOpen, setJourneysOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Fade away on-screen instructions after 6 seconds
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowInstructions(false);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  // Auto-dismiss discovery toast after 6 seconds
  useEffect(() => {
    if (!latestDiscovery) return;
    const timer = window.setTimeout(() => {
      clearLatestDiscovery();
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [latestDiscovery, clearLatestDiscovery]);

  // Keyboard shortcuts (Escape & 'p' for Photo Mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoMode) {
          setPhotoMode(false);
        } else if (openDemoId) {
          setOpenDemoId(null);
        } else if (controlsOpen) {
          setControlsOpen(false);
        } else if (filtersOpen) {
          setFiltersOpen(false);
        } else if (journeysOpen) {
          setJourneysOpen(false);
        } else if (selectedTermId && !activeJourneyId) {
          selectTerm(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    photoMode,
    setPhotoMode,
    openDemoId,
    controlsOpen,
    filtersOpen,
    journeysOpen,
    selectedTermId,
    activeJourneyId,
    selectTerm,
    setOpenDemoId,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050814] text-slate-100">
      <LoadingOverlay />

      {!photoMode && (
        <>
          <TopBar
            filtersOpen={filtersOpen}
            onToggleFilters={() => {
              setFiltersOpen((v) => !v);
              setJourneysOpen(false);
              setControlsOpen(false);
            }}
            journeysOpen={journeysOpen}
            onToggleJourneys={() => {
              setJourneysOpen((v) => !v);
              setFiltersOpen(false);
              setControlsOpen(false);
            }}
            controlsOpen={controlsOpen}
            onToggleControls={() => {
              setControlsOpen((v) => !v);
              setFiltersOpen(false);
              setJourneysOpen(false);
            }}
          />

          <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
          <JourneysMenu open={journeysOpen} onClose={() => setJourneysOpen(false)} />
          <ControlsDrawer open={controlsOpen} onClose={() => setControlsOpen(false)} />
        </>
      )}

      {viewMode === 'galaxy' || photoMode ? <GalaxyCanvas /> : <ListView />}

      {/* Clean on-screen instructions that gently fade away after a few seconds */}
      {!photoMode && viewMode === 'galaxy' && !selectedTermId && !activeJourneyId && (
        <div
          className={`pointer-events-none fixed bottom-16 sm:bottom-16 left-1/2 -translate-x-1/2 z-10 px-3 w-full max-w-lg text-center transition-opacity duration-700 ${
            showInstructions ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!showInstructions}
        >
          <p className="inline-block rounded-xl border border-slate-800/80 bg-[#0B1120]/85 px-4 py-2 text-xs text-slate-200 backdrop-blur-xl shadow-lg">
            Drag to glide with momentum · Scroll or pinch to zoom · Find {HIDDEN_DISCOVERIES.length} hidden cosmic anomalies
          </p>
        </div>
      )}

      {/* Hidden Discovery celebration toast */}
      {!photoMode && latestDiscovery && (
        <div
          role="status"
          className="pointer-events-auto fixed top-18 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md rounded-2xl border border-amber-500/45 bg-[#0B1120]/94 p-4 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Cosmic Discovery Unlocked</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  {discoveredIds.size}/{HIDDEN_DISCOVERIES.length}
                </span>
              </div>
              <h3 className="mt-1 font-display text-base font-semibold text-slate-50">
                {latestDiscovery.symbol} {latestDiscovery.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {latestDiscovery.note}
              </p>
            </div>
            <button
              type="button"
              onClick={clearLatestDiscovery}
              aria-label="Dismiss discovery notification"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Subtle Photo Mode exit trigger */}
      {photoMode && (
        <button
          type="button"
          onClick={() => setPhotoMode(false)}
          aria-label="Exit photo mode"
          className="fixed bottom-4 right-4 z-40 flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-700/70 bg-[#0B1120]/65 px-3.5 text-xs font-medium text-slate-200 opacity-50 hover:opacity-100 backdrop-blur-md transition-opacity"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Exit Photo Mode</span>
        </button>
      )}

      {!photoMode && (
        <>
          <JourneyBar />
          <TermPanel />
          <DemoModal />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GalaxyProvider>
      <GalaxyShell />
    </GalaxyProvider>
  );
}
