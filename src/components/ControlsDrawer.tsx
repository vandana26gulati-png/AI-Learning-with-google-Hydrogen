import React from 'react';
import { Check, Compass, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { HIDDEN_DISCOVERIES } from '../data/discoveries';
import { useGalaxyStore } from '../store/galaxyStore';

interface ControlsDrawerProps {
  open: boolean;
  onClose: () => void;
}

function describeSkyPhase(val: number): string {
  if (val < 30) return 'Deep Midnight';
  if (val < 65) return 'Cosmic Twilight';
  return 'Aurora Horizon';
}

export function ControlsDrawer({ open, onClose }: ControlsDrawerProps) {
  const {
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
    discoveredIds,
    flyToDiscovery,
  } = useGalaxyStore();

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Atmosphere, sound, and cosmic discoveries"
      className="fixed top-16 right-3 left-3 sm:left-auto sm:right-5 z-30 sm:w-[400px] max-h-[78vh] overflow-y-auto galaxy-scroll rounded-2xl border border-slate-800/90 bg-[#0B1120]/90 p-4 sm:p-5 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Atmosphere &amp; Audio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune sky lighting, particle bloom, and cosmic sound
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close controls panel"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sliders */}
      <div className="py-4 space-y-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="sky-phase-slider" className="font-medium text-slate-200">
              Time of day
            </label>
            <span className="font-mono text-cyan-300">
              {describeSkyPhase(timeOfDay)} · {Math.round(timeOfDay)}%
            </span>
          </div>
          <input
            id="sky-phase-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(Number(e.target.value))}
            className="w-full h-2 cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="speed-slider" className="font-medium text-slate-200">
              Cosmic drift speed
            </label>
            <span className="font-mono text-indigo-300">{motionSpeed.toFixed(1)}x</span>
          </div>
          <input
            id="speed-slider"
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={motionSpeed}
            onChange={(e) => setMotionSpeed(Number(e.target.value))}
            className="w-full h-2 cursor-pointer accent-indigo-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="effects-slider" className="font-medium text-slate-200">
              Glow &amp; particle intensity
            </label>
            <span className="font-mono text-teal-300">
              {Math.round(effectsIntensity * 100)}%
            </span>
          </div>
          <input
            id="effects-slider"
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={effectsIntensity}
            onChange={(e) => setEffectsIntensity(Number(e.target.value))}
            className="w-full h-2 cursor-pointer accent-teal-400"
          />
        </div>
      </div>

      {/* Sound toggles */}
      <div className="py-4 border-b border-slate-800/80 space-y-2.5">
        <p className="text-xs font-medium text-slate-400">Audio (muted by default)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAmbientSoundOn(!ambientSoundOn)}
            aria-pressed={ambientSoundOn}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors ${
              ambientSoundOn
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {ambientSoundOn ? (
              <Volume2 className="h-4 w-4 shrink-0" />
            ) : (
              <VolumeX className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span className="whitespace-nowrap">Ambient {ambientSoundOn ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSfxOn(!sfxOn)}
            aria-pressed={sfxOn}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors ${
              sfxOn
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            {sfxOn ? (
              <Sparkles className="h-4 w-4 shrink-0" />
            ) : (
              <VolumeX className="h-4 w-4 shrink-0 text-slate-500" />
            )}
            <span className="whitespace-nowrap">Effects {sfxOn ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Hidden discoveries log */}
      <div className="pt-4">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-medium text-slate-200">Hidden Cosmic Discoveries</span>
          <span className="font-mono text-amber-300">
            {discoveredIds.size} / {HIDDEN_DISCOVERIES.length} found
          </span>
        </div>

        <div className="space-y-1.5">
          {HIDDEN_DISCOVERIES.map((item) => {
            const found = discoveredIds.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm"
                      style={{ color: found ? item.color : '#64748b' }}
                      aria-hidden="true"
                    >
                      {item.symbol}
                    </span>
                    <span className={found ? 'font-medium text-slate-100' : 'text-slate-400'}>
                      {found ? item.name : 'Uncharted Anomaly'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {found ? item.note : item.hint}
                  </p>
                </div>
                {found ? (
                  <button
                    type="button"
                    onClick={() => {
                      flyToDiscovery(item.id);
                      onClose();
                    }}
                    title="Fly to discovery"
                    aria-label={`Fly to ${item.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-300 hover:bg-slate-800"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-600"
                    aria-hidden="true"
                  >
                    <Compass className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
