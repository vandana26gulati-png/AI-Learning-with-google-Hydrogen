import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Candidate {
  token: string;
  logit: number;
}

const PROMPTS: { text: string; candidates: Candidate[] }[] = [
  {
    text: 'The astronomer pointed the telescope toward the glowing ___',
    candidates: [
      { token: 'nebula', logit: 5.4 },
      { token: 'galaxy', logit: 4.8 },
      { token: 'constellation', logit: 3.9 },
      { token: 'planet', logit: 3.2 },
      { token: 'comet', logit: 2.5 },
      { token: 'lantern', logit: 0.6 },
    ],
  },
  {
    text: 'When a Transformer reads text, it predicts the next ___',
    candidates: [
      { token: 'token', logit: 5.8 },
      { token: 'word', logit: 5.1 },
      { token: 'symbol', logit: 3.4 },
      { token: 'character', logit: 2.9 },
      { token: 'paragraph', logit: 1.9 },
      { token: 'melody', logit: 0.4 },
    ],
  },
];

export function NextTokenDemo() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [temperature, setTemperature] = useState(0.7);
  const [sampledToken, setSampledToken] = useState<string | null>(null);

  const prompt = PROMPTS[promptIdx];

  const distribution = useMemo(() => {
    const temp = Math.max(0.08, temperature);
    const scaled = prompt.candidates.map((c) => Math.exp(c.logit / temp));
    const sum = scaled.reduce((a, b) => a + b, 0) || 1;
    return prompt.candidates.map((c, idx) => ({
      token: c.token,
      prob: scaled[idx] / sum,
    }));
  }, [prompt, temperature]);

  const sampleNow = () => {
    const r = Math.random();
    let acc = 0;
    for (const item of distribution) {
      acc += item.prob;
      if (r <= acc) {
        setSampledToken(item.token);
        return;
      }
    }
    setSampledToken(distribution[0].token);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Slide <strong className="text-slate-200">Temperature</strong> down for safe, focused
        predictions, or turn it up to flatten probabilities and invite creative surprises.
      </p>

      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p, idx) => (
          <button
            key={p.text}
            type="button"
            onClick={() => {
              setPromptIdx(idx);
              setSampledToken(null);
            }}
            className={`min-h-[36px] rounded-xl px-3 text-xs font-medium transition-colors ${
              promptIdx === idx
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/45'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            Prompt {idx + 1}
          </button>
        ))}
      </div>

      {/* Prompt display */}
      <div className="rounded-xl border border-slate-800 bg-[#060913] p-3.5 text-sm text-slate-200 leading-relaxed">
        {prompt.text.replace('___', '')}
        <span className="inline-block rounded-lg border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 font-mono text-xs text-amber-200">
          {sampledToken ?? '___'}
        </span>
      </div>

      {/* Temperature slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="temp-slider" className="font-medium text-slate-200">
            Temperature
          </label>
          <span className="font-mono text-amber-300">{temperature.toFixed(2)}</span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min="0.1"
          max="2.0"
          step="0.05"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-amber-400 h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>0.1 (Deterministic)</span>
          <span>0.7 (Balanced)</span>
          <span>2.0 (Creative)</span>
        </div>
      </div>

      {/* Probability bars */}
      <div className="space-y-2">
        {distribution.map((item) => {
          const pct = Math.round(item.prob * 1000) / 10;
          const isSampled = sampledToken === item.token;
          return (
            <div key={item.token} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-mono ${
                    isSampled ? 'text-amber-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  {item.token}
                </span>
                <span className="font-mono text-slate-400">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isSampled ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.max(1.5, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={sampleNow}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/45 text-xs sm:text-sm font-medium text-amber-200 hover:bg-amber-500/30"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>Sample next token</span>
      </button>
    </div>
  );
}
