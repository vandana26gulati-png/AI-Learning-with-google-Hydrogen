import React, { useMemo, useState } from 'react';

interface TokenChip {
  text: string;
  id: number;
  colorIndex: number;
}

const TOKEN_COLORS = [
  'bg-sky-500/20 text-sky-200 border-sky-500/40',
  'bg-teal-500/20 text-teal-200 border-teal-500/40',
  'bg-amber-500/20 text-amber-200 border-amber-500/40',
  'bg-violet-500/20 text-violet-200 border-violet-500/40',
  'bg-rose-500/20 text-rose-200 border-rose-500/40',
  'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
];

function deterministicId(token: string): number {
  let h = 5381;
  for (let i = 0; i < token.length; i++) {
    h = (h * 33) ^ token.charCodeAt(i);
  }
  return (Math.abs(h) % 49000) + 1000;
}

// Simple rule-based subword approximation for educational illustration
function approximateTokenize(input: string): TokenChip[] {
  if (!input) return [];
  const rawChunks = input.match(/\s+|[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) ?? [];
  const tokens: TokenChip[] = [];

  for (const chunk of rawChunks) {
    if (/^\s+$/.test(chunk)) {
      // Represent leading/inline spaces attached or as visible space token
      tokens.push({
        text: chunk.replace(/ /g, '·'),
        id: deterministicId(chunk),
        colorIndex: tokens.length % TOKEN_COLORS.length,
      });
      continue;
    }

    if (/^[A-Za-z]+$/.test(chunk) && chunk.length > 6) {
      // Split common prefixes/suffixes or long words into subword pieces
      const match = chunk.match(/^(un|re|pre|dis|non|over|sub)?(.+?)(ing|tion|able|ment|ness|ly|ed|er|s)?$/i);
      const parts: string[] = [];
      if (match) {
        if (match[1]) parts.push(match[1]);
        if (match[2]) {
          if (match[2].length > 6) {
            const mid = Math.ceil(match[2].length / 2);
            parts.push(match[2].slice(0, mid), match[2].slice(mid));
          } else {
            parts.push(match[2]);
          }
        }
        if (match[3]) parts.push(match[3]);
      } else {
        parts.push(chunk);
      }

      for (const p of parts) {
        if (!p) continue;
        tokens.push({
          text: p,
          id: deterministicId(p),
          colorIndex: tokens.length % TOKEN_COLORS.length,
        });
      }
    } else {
      tokens.push({
        text: chunk,
        id: deterministicId(chunk),
        colorIndex: tokens.length % TOKEN_COLORS.length,
      });
    }
  }

  return tokens;
}

const PRESETS = [
  'Unbelievable transformers tokenize language!',
  'AI Concept Galaxy teaches NLP & LLMs in 2026.',
  'Pretraining predicts the next subword token.',
];

export function TokenizerDemo() {
  const [text, setText] = useState(PRESETS[0]);
  const tokens = useMemo(() => approximateTokenize(text), [text]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Type any sentence to see how text is broken into discrete pieces and numeric IDs.{' '}
        <span className="text-amber-300">
          Simple rule-based approximation for illustration (real models use BPE/SentencePiece vocabularies).
        </span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((sample, i) => (
          <button
            key={sample}
            type="button"
            onClick={() => setText(sample)}
            className="min-h-[34px] rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 text-[11px] text-slate-300 hover:bg-slate-800"
          >
            Sample {i + 1}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="tokenizer-input" className="sr-only">
          Input sentence to tokenize
        </label>
        <textarea
          id="tokenizer-input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text here..."
          className="w-full rounded-xl border border-slate-800 bg-[#060913] p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Characters: {text.length}</span>
        <span>Tokens: {tokens.length}</span>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#060913]/80 p-3.5 min-h-[96px]">
        {tokens.length === 0 ? (
          <p className="text-xs text-slate-500">Start typing above to inspect tokens.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((tok, idx) => (
              <div
                key={`${tok.id}-${idx}`}
                className={`inline-flex items-baseline gap-1.5 rounded-lg border px-2 py-1 text-xs transition-transform ${TOKEN_COLORS[tok.colorIndex]}`}
              >
                <span className="font-medium">{tok.text}</span>
                <span className="font-mono text-[10px] opacity-75">#{tok.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
