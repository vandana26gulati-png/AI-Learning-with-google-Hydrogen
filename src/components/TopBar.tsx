import React, { useState } from 'react';
import {
  Camera,
  Compass,
  List,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
  SunMoon,
  X,
} from 'lucide-react';
import { HIDDEN_DISCOVERIES } from '../data/discoveries';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';

interface TopBarProps {
  filtersOpen: boolean;
  onToggleFilters: () => void;
  journeysOpen: boolean;
  onToggleJourneys: () => void;
  controlsOpen: boolean;
  onToggleControls: () => void;
}

export function TopBar({
  filtersOpen,
  onToggleFilters,
  journeysOpen,
  onToggleJourneys,
  controlsOpen,
  onToggleControls,
}: TopBarProps) {
  const {
    exploredIds,
    discoveredIds,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    activeClusterIds,
    activeLevels,
    matchingTermIds,
    hasActiveFilters,
    setPhotoMode,
  } = useGalaxyStore();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const totalTerms = galaxyData.terms.length;
  const exploredCount = exploredIds.size;
  const progressRatio = totalTerms > 0 ? exploredCount / totalTerms : 0;
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const activeFilterCount = activeClusterIds.size + activeLevels.size;

  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-30 flex flex-col gap-2 px-3 pt-2.5 sm:px-5 sm:pt-3">
      <div className="pointer-events-auto flex h-12 sm:h-13 items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-slate-800/80 bg-[#0B1120]/82 px-3 sm:px-4 backdrop-blur-xl shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display text-sm sm:text-lg font-semibold tracking-tight text-slate-50 whitespace-nowrap">
            AI Concept Galaxy
          </span>
        </div>

        {/* Desktop inline search */}
        <div className="relative hidden md:flex flex-1 max-w-sm items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms (attention, RAG, tokens)..."
            aria-label="Search AI terms"
            className="h-9 w-full rounded-xl border border-slate-800 bg-[#060913]/80 pl-9 pr-16 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
          />
          {hasActiveFilters && (
            <span className="pointer-events-none absolute right-8 font-mono text-[11px] text-cyan-300">
              {matchingTermIds.size}
            </span>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right controls + Progress Ring + Discoveries */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Hidden Discoveries counter */}
          <button
            type="button"
            onClick={onToggleControls}
            title={`Found ${discoveredIds.size} of ${HIDDEN_DISCOVERIES.length} hidden cosmic discoveries`}
            aria-label={`Found ${discoveredIds.size} of ${HIDDEN_DISCOVERIES.length} hidden cosmic discoveries`}
            className="hidden sm:flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-mono text-amber-300 hover:bg-slate-800/70 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {discoveredIds.size}/{HIDDEN_DISCOVERIES.length}
            </span>
          </button>

          {/* Progress Ring */}
          <div
            className="flex items-center gap-1.5 pr-1 sm:pr-2"
            title={`Explored ${exploredCount} of ${totalTerms} concepts`}
            aria-label={`Explored ${exploredCount} of ${totalTerms} concepts`}
          >
            <svg className="h-7 w-7 sm:h-8 sm:w-8 -rotate-90 shrink-0" viewBox="0 0 34 34" aria-hidden="true">
              <circle
                cx="17"
                cy="17"
                r={radius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.18)"
                strokeWidth="3"
              />
              <circle
                cx="17"
                cy="17"
                r={radius}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <span className="hidden lg:inline font-mono text-xs text-slate-300 whitespace-nowrap">
              {exploredCount}/{totalTerms}
            </span>
          </div>

          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label={mobileSearchOpen ? 'Close search' : 'Search concepts'}
            aria-expanded={mobileSearchOpen}
            className={`flex md:hidden h-11 w-10 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              mobileSearchOpen || searchQuery
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Atmosphere & Audio Controls */}
          <button
            type="button"
            onClick={onToggleControls}
            aria-label="Atmosphere, sound, and discoveries"
            aria-expanded={controlsOpen}
            className={`flex h-11 min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              controlsOpen
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/45'
                : 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <SunMoon className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline">Atmosphere</span>
          </button>

          {/* Filters button */}
          <button
            type="button"
            onClick={onToggleFilters}
            aria-label="Filter by cluster and level"
            aria-expanded={filtersOpen}
            className={`relative flex h-11 min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="hidden xl:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="font-mono text-[11px] text-cyan-300">({activeFilterCount})</span>
            )}
          </button>

          {/* Guided Journeys button */}
          <button
            type="button"
            onClick={onToggleJourneys}
            aria-label="Guided journeys"
            aria-expanded={journeysOpen}
            className={`flex h-11 min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
              journeysOpen
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Route className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Journeys</span>
          </button>

          {/* Galaxy / List view toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'galaxy' ? 'list' : 'galaxy')}
            aria-label={
              viewMode === 'galaxy'
                ? 'Switch to accessible list view'
                : 'Switch to galaxy star map'
            }
            className="flex h-11 min-w-[40px] items-center justify-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800/80 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {viewMode === 'galaxy' ? (
              <>
                <List className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline">List</span>
              </>
            ) : (
              <>
                <Compass className="h-4 w-4 shrink-0 text-cyan-300" />
                <span className="hidden sm:inline text-cyan-200">Galaxy</span>
              </>
            )}
          </button>

          {/* Photo mode button */}
          {viewMode === 'galaxy' && (
            <button
              type="button"
              onClick={() => setPhotoMode(true)}
              title="Photo mode (hide UI for clean screenshots)"
              aria-label="Enter photo mode"
              className="flex h-11 w-10 sm:w-11 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable mobile search bar */}
      {mobileSearchOpen && (
        <div className="pointer-events-auto flex md:hidden items-center gap-2 rounded-xl border border-slate-800/90 bg-[#0B1120]/95 p-2 backdrop-blur-md">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI, NLP, LLM terms..."
              aria-label="Search AI terms"
              className="h-10 w-full rounded-lg border border-slate-800 bg-[#060913] pl-9 pr-14 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
            />
            {hasActiveFilters && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-300">
                {matchingTermIds.size}
              </span>
            )}
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="flex h-10 px-3 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </header>
  );
}
