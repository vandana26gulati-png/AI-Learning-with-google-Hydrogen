import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';

// Smooth non-convex loss landscape L(w)
function lossFn(w: number): number {
  return 0.42 * Math.pow(w - 0.35, 2) + 0.14 * Math.sin(3.8 * w) + 0.22;
}

function lossGrad(w: number): number {
  return 0.84 * (w - 0.35) + 0.14 * 3.8 * Math.cos(3.8 * w);
}

export function GradientDescentDemo() {
  const [learningRate, setLearningRate] = useState(0.22);
  const [w, setW] = useState(-1.65);
  const [trail, setTrail] = useState<number[]>([-1.65]);
  const [playing, setPlaying] = useState(true);
  const [stepCount, setStepCount] = useState(0);

  const takeStep = () => {
    setW((prevW) => {
      const grad = lossGrad(prevW);
      let nextW = prevW - learningRate * grad;
      nextW = Math.max(-2.15, Math.min(2.15, nextW));
      setTrail((prevTrail) => [...prevTrail.slice(-24), nextW]);
      setStepCount((s) => s + 1);
      return nextW;
    });
  };

  const reset = (startW = -1.65) => {
    setW(startW);
    setTrail([startW]);
    setStepCount(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      takeStep();
    }, 240);
    return () => window.clearInterval(timer);
  }, [playing, learningRate]);

  // SVG coordinate projection
  const svgW = 460;
  const svgH = 210;
  const padX = 28;
  const padY = 22;

  const mapX = (val: number) => ((val + 2.2) / 4.4) * (svgW - padX * 2) + padX;
  const mapY = (loss: number) => svgH - padY - Math.min(2.4, Math.max(0, loss)) / 2.4 * (svgH - padY * 2);

  const curvePoints: string[] = [];
  for (let x = -2.15; x <= 2.15; x += 0.05) {
    curvePoints.push(`${mapX(x).toFixed(1)},${mapY(lossFn(x)).toFixed(1)}`);
  }

  const currentLoss = lossFn(w);
  const currentGrad = lossGrad(w);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Watch the parameter ball roll downhill along the loss curve. Try a tiny learning rate
        (slow crawl) vs. a high rate (overshooting!).
      </p>

      {/* Loss landscape SVG */}
      <div className="rounded-xl border border-slate-800 bg-[#060913] p-2">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" role="img" aria-label="Gradient descent loss curve">
          {/* Baseline axis */}
          <line
            x1={padX}
            y1={svgH - padY}
            x2={svgW - padX}
            y2={svgH - padY}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1"
          />
          <text x={padX} y={svgH - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
            Weight (w)
          </text>
          <text x={svgW - 70} y={16} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
            Loss L(w)
          </text>

          {/* Curve */}
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            points={curvePoints.join(' ')}
          />

          {/* Trail */}
          {trail.map((tw, idx) => (
            <circle
              key={idx}
              cx={mapX(tw)}
              cy={mapY(lossFn(tw))}
              r="3"
              fill="#F59E0B"
              opacity={0.18 + (idx / trail.length) * 0.55}
            />
          ))}

          {/* Ball */}
          <circle
            cx={mapX(w)}
            cy={mapY(currentLoss)}
            r="8"
            fill="#F59E0B"
            stroke="#ffffff"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 py-2 px-2">
          <div className="text-[11px] text-slate-400">Step</div>
          <div className="font-mono text-sm font-semibold text-slate-100">{stepCount}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 py-2 px-2">
          <div className="text-[11px] text-slate-400">Loss</div>
          <div className="font-mono text-sm font-semibold text-cyan-300">
            {currentLoss.toFixed(3)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 py-2 px-2">
          <div className="text-[11px] text-slate-400">Slope</div>
          <div className="font-mono text-sm font-semibold text-amber-300">
            {currentGrad.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Learning rate slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="lr-slider" className="font-medium text-slate-200">
            Learning rate (step size)
          </label>
          <span className="font-mono text-cyan-300">{learningRate.toFixed(2)}</span>
        </div>
        <input
          id="lr-slider"
          type="range"
          min="0.02"
          max="1.15"
          step="0.02"
          value={learningRate}
          onChange={(e) => setLearningRate(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>0.02 (Slow)</span>
          <span>0.25 (Balanced)</span>
          <span>1.15 (Overshoots)</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-xs font-medium text-cyan-200 hover:bg-cyan-500/30"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{playing ? 'Pause' : 'Play'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            takeStep();
          }}
          className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          <StepForward className="h-3.5 w-3.5" />
          <span>Step</span>
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
