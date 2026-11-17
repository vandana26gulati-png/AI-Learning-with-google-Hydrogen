import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cosmicAudio } from '../audio/cosmicAudio';
import { HIDDEN_DISCOVERIES, type HiddenDiscovery } from '../data/discoveries';
import { galaxyData } from '../data/loadData';
import type { DemoId, TermLevel, ViewMode } from '../types/galaxy';

const STORAGE_KEYS = {
  explored: 'ai_concept_galaxy_explored_v1',
  discoveries: 'ai_concept_galaxy_discoveries_v1',
  settings: 'ai_concept_galaxy_settings_v2',
};

interface PersistedSettings {
  eli5Mode: boolean;
  viewMode: ViewMode;
  reducedMotionOverride: boolean | null;
  timeOfDay: number;
  motionSpeed: number;
  effectsIntensity: number;
}

interface GalaxyContextValue {
  exploredIds: Set<string>;
  toggleExplored: (id: string) => void;
  markExplored: (id: string) => void;
  discoveredIds: Set<string>;
  collectDiscovery: (id: string) => void;
  latestDiscovery: HiddenDiscovery | null;
  clearLatestDiscovery: () => void;
  focusDiscoverySignal: { id: string; nonce: number } | null;
  flyToDiscovery: (id: string) => void;
  selectedTermId: string | null;
  selectTerm: (id: string | null, opts?: { autoMarkExplored?: boolean }) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeClusterIds: Set<string>;
  toggleClusterFilter: (clusterId: string) => void;
  clearClusterFilters: () => void;
  activeLevels: Set<TermLevel>;
  toggleLevelFilter: (level: TermLevel) => void;
  clearAllFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  eli5Mode: boolean;
  setEli5Mode: (val: boolean) => void;
  prefersReducedMotion: boolean;
  reducedMotionOverride: boolean | null;
  setReducedMotionOverride: (val: boolean | null) => void;
  timeOfDay: number;
  setTimeOfDay: (val: number) => void;
  motionSpeed: number;
  setMotionSpeed: (val: number) => void;
  effectsIntensity: number;
  setEffectsIntensity: (val: number) => void;
  ambientSoundOn: boolean;
  setAmbientSoundOn: (val: boolean) => void;
  sfxOn: boolean;
  setSfxOn: (val: boolean) => void;
  photoMode: boolean;
  setPhotoMode: (val: boolean) => void;
  activeJourneyId: string | null;
  journeyStepIndex: number;
  journeyPlaying: boolean;
  startJourney: (journeyId: string) => void;
  stopJourney: () => void;
  setJourneyPlaying: (playing: boolean) => void;
  stepJourney: (delta: number) => void;
  goToJourneyStep: (index: number) => void;
  openDemoId: DemoId | null;
  setOpenDemoId: (demoId: DemoId | null) => void;
  resetCameraSignal: number;
  triggerResetCamera: () => void;
  matchingTermIds: Set<string>;
  hasActiveFilters: boolean;
}

const GalaxyContext = createContext<GalaxyContextValue | null>(null);

function loadExploredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.explored);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id) => typeof id === 'string' && galaxyData.termMap.has(id)));
    }
  } catch {
    // ignore
  }
  return new Set();
}

function loadDiscoveredIds(): Set<string> {
  const valid = new Set(HIDDEN_DISCOVERIES.map((d) => d.id));
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.discoveries);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id) => typeof id === 'string' && valid.has(id)));
    }
  } catch {
    // ignore
  }
  return new Set();
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        eli5Mode: Boolean(parsed.eli5Mode),
        viewMode: parsed.viewMode === 'list' ? 'list' : 'galaxy',
        reducedMotionOverride:
          typeof parsed.reducedMotionOverride === 'boolean' ? parsed.reducedMotionOverride : null,
        timeOfDay:
          typeof parsed.timeOfDay === 'number'
            ? Math.max(0, Math.min(100, parsed.timeOfDay))
            : 18,
        motionSpeed:
          typeof parsed.motionSpeed === 'number'
            ? Math.max(0.2, Math.min(2.5, parsed.motionSpeed))
            : 1.0,
        effectsIntensity:
          typeof parsed.effectsIntensity === 'number'
            ? Math.max(0, Math.min(1.5, parsed.effectsIntensity))
            : 1.0,
      };
    }
  } catch {
    // ignore
  }
  return {
    eli5Mode: false,
    viewMode: 'galaxy',
    reducedMotionOverride: null,
    timeOfDay: 18,
    motionSpeed: 1.0,
    effectsIntensity: 1.0,
  };
}

export function GalaxyProvider({ children }: { children: React.ReactNode }) {
  const initialSettings = useMemo(() => loadSettings(), []);

  const [exploredIds, setExploredIds] = useState<Set<string>>(() => loadExploredIds());
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(() => loadDiscoveredIds());
  const [latestDiscovery, setLatestDiscovery] = useState<HiddenDiscovery | null>(null);
  const [focusDiscoverySignal, setFocusDiscoverySignal] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClusterIds, setActiveClusterIds] = useState<Set<string>>(() => new Set());
  const [activeLevels, setActiveLevels] = useState<Set<TermLevel>>(() => new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(initialSettings.viewMode);
  const [eli5Mode, setEli5Mode] = useState<boolean>(initialSettings.eli5Mode);
  const [reducedMotionOverride, setReducedMotionOverride] = useState<boolean | null>(
    initialSettings.reducedMotionOverride
  );
  const [systemReducedMotion, setSystemReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [timeOfDay, setTimeOfDay] = useState<number>(initialSettings.timeOfDay);
  const [motionSpeed, setMotionSpeed] = useState<number>(initialSettings.motionSpeed);
  const [effectsIntensity, setEffectsIntensity] = useState<number>(
    initialSettings.effectsIntensity
  );

  // Sound is strictly muted by default
  const [ambientSoundOn, setAmbientSoundOnState] = useState<boolean>(false);
  const [sfxOn, setSfxOnState] = useState<boolean>(false);
  const [photoMode, setPhotoMode] = useState<boolean>(false);

  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyStepIndex, setJourneyStepIndex] = useState(0);
  const [journeyPlaying, setJourneyPlaying] = useState(false);
  const [openDemoId, setOpenDemoId] = useState<DemoId | null>(null);
  const [resetCameraSignal, setResetCameraSignal] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.explored, JSON.stringify([...exploredIds]));
    } catch {
      // ignore
    }
  }, [exploredIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.discoveries, JSON.stringify([...discoveredIds]));
    } catch {
      // ignore
    }
  }, [discoveredIds]);

  useEffect(() => {
    try {
      const payload: PersistedSettings = {
        eli5Mode,
        viewMode,
        reducedMotionOverride,
        timeOfDay,
        motionSpeed,
        effectsIntensity,
      };
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [eli5Mode, viewMode, reducedMotionOverride, timeOfDay, motionSpeed, effectsIntensity]);

  const setAmbientSoundOn = useCallback((val: boolean) => {
    setAmbientSoundOnState(val);
    cosmicAudio.setAmbient(val);
  }, []);

  const setSfxOn = useCallback((val: boolean) => {
    setSfxOnState(val);
    cosmicAudio.setSfx(val);
  }, []);

  const prefersReducedMotion =
    reducedMotionOverride !== null ? reducedMotionOverride : systemReducedMotion;

  const markExplored = useCallback((id: string) => {
    setExploredIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const toggleExplored = useCallback((id: string) => {
    setExploredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const collectDiscovery = useCallback((id: string) => {
    const found = HIDDEN_DISCOVERIES.find((d) => d.id === id);
    if (!found) return;
    setDiscoveredIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setLatestDiscovery(found);
    cosmicAudio.playDiscovery();
  }, []);

  const clearLatestDiscovery = useCallback(() => {
    setLatestDiscovery(null);
  }, []);

  const flyToDiscovery = useCallback((id: string) => {
    setViewMode('galaxy');
    setFocusDiscoverySignal((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
  }, []);

  const selectTerm = useCallback(
    (id: string | null, opts?: { autoMarkExplored?: boolean }) => {
      setSelectedTermId(id);
      if (id) {
        cosmicAudio.playStarTap();
        if (opts?.autoMarkExplored) {
          markExplored(id);
        }
      }
    },
    [markExplored]
  );

  const toggleClusterFilter = useCallback((clusterId: string) => {
    setActiveClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  }, []);

  const clearClusterFilters = useCallback(() => {
    setActiveClusterIds(new Set());
  }, []);

  const toggleLevelFilter = useCallback((level: TermLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveClusterIds(new Set());
    setActiveLevels(new Set());
  }, []);

  const startJourney = useCallback(
    (journeyId: string) => {
      const journey = galaxyData.journeys.find((j) => j.id === journeyId);
      if (!journey || journey.steps.length === 0) return;
      setActiveClusterIds(new Set());
      setActiveLevels(new Set());
      setSearchQuery('');
      setViewMode('galaxy');
      setActiveJourneyId(journeyId);
      setJourneyStepIndex(0);
      setJourneyPlaying(true);
      const firstTermId = journey.steps[0].termId;
      setSelectedTermId(firstTermId);
      markExplored(firstTermId);
      cosmicAudio.playStarTap();
    },
    [markExplored]
  );

  const stopJourney = useCallback(() => {
    setActiveJourneyId(null);
    setJourneyPlaying(false);
    setJourneyStepIndex(0);
  }, []);

  const goToJourneyStep = useCallback(
    (index: number) => {
      if (!activeJourneyId) return;
      const journey = galaxyData.journeys.find((j) => j.id === activeJourneyId);
      if (!journey) return;
      const clamped = Math.max(0, Math.min(journey.steps.length - 1, index));
      setJourneyStepIndex(clamped);
      const stepTermId = journey.steps[clamped].termId;
      setSelectedTermId(stepTermId);
      markExplored(stepTermId);
      cosmicAudio.playStarTap();
    },
    [activeJourneyId, markExplored]
  );

  const stepJourney = useCallback(
    (delta: number) => {
      if (!activeJourneyId) return;
      const journey = galaxyData.journeys.find((j) => j.id === activeJourneyId);
      if (!journey) return;
      const nextIdx = journeyStepIndex + delta;
      if (nextIdx >= journey.steps.length) {
        setJourneyPlaying(false);
        return;
      }
      if (nextIdx < 0) {
        goToJourneyStep(0);
        return;
      }
      goToJourneyStep(nextIdx);
    },
    [activeJourneyId, journeyStepIndex, goToJourneyStep]
  );

  useEffect(() => {
    if (!activeJourneyId || !journeyPlaying) return;
    const journey = galaxyData.journeys.find((j) => j.id === activeJourneyId);
    if (!journey) return;

    const timer = window.setInterval(() => {
      setJourneyStepIndex((prev) => {
        const next = prev + 1;
        if (next >= journey.steps.length) {
          setJourneyPlaying(false);
          return prev;
        }
        const termId = journey.steps[next].termId;
        setSelectedTermId(termId);
        markExplored(termId);
        cosmicAudio.playStarTap();
        return next;
      });
    }, prefersReducedMotion ? 5500 : 4800);

    return () => window.clearInterval(timer);
  }, [activeJourneyId, journeyPlaying, prefersReducedMotion, markExplored]);

  const triggerResetCamera = useCallback(() => {
    setResetCameraSignal((n) => n + 1);
  }, []);

  const matchingTermIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const hasCluster = activeClusterIds.size > 0;
    const hasLevel = activeLevels.size > 0;
    const matched = new Set<string>();

    for (const term of galaxyData.terms) {
      if (hasCluster && !activeClusterIds.has(term.cluster)) continue;
      if (hasLevel && !activeLevels.has(term.level)) continue;
      if (q) {
        const clusterName = galaxyData.clusterMap.get(term.cluster)?.name.toLowerCase() ?? '';
        const matchesText =
          term.term.toLowerCase().includes(q) ||
          term.short.toLowerCase().includes(q) ||
          term.id.toLowerCase().includes(q) ||
          clusterName.includes(q);
        if (!matchesText) continue;
      }
      matched.add(term.id);
    }

    return matched;
  }, [searchQuery, activeClusterIds, activeLevels]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || activeClusterIds.size > 0 || activeLevels.size > 0;

  const value: GalaxyContextValue = {
    exploredIds,
    toggleExplored,
    markExplored,
    discoveredIds,
    collectDiscovery,
    latestDiscovery,
    clearLatestDiscovery,
    focusDiscoverySignal,
    flyToDiscovery,
    selectedTermId,
    selectTerm,
    searchQuery,
    setSearchQuery,
    activeClusterIds,
    toggleClusterFilter,
    clearClusterFilters,
    activeLevels,
    toggleLevelFilter,
    clearAllFilters,
    viewMode,
    setViewMode,
    eli5Mode,
    setEli5Mode,
    prefersReducedMotion,
    reducedMotionOverride,
    setReducedMotionOverride,
    timeOfDay,
    setTimeOfDay,
    motionSpeed,
    setMotionSpeed,
    effectsIntensity,
    setEffectsIntensity,
    ambientSoundOn,
    setAmbientSoundOn,
    sfxOn,
    setSfxOn,
    photoMode,
    setPhotoMode,
    activeJourneyId,
    journeyStepIndex,
    journeyPlaying,
    startJourney,
    stopJourney,
    setJourneyPlaying,
    stepJourney,
    goToJourneyStep,
    openDemoId,
    setOpenDemoId,
    resetCameraSignal,
    triggerResetCamera,
    matchingTermIds,
    hasActiveFilters,
  };

  return <GalaxyContext.Provider value={value}>{children}</GalaxyContext.Provider>;
}

export function useGalaxyStore(): GalaxyContextValue {
  const ctx = useContext(GalaxyContext);
  if (!ctx) {
    throw new Error('useGalaxyStore must be used inside GalaxyProvider');
  }
  return ctx;
}
