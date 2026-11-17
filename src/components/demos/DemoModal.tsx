import React from 'react';
import { X } from 'lucide-react';
import { useGalaxyStore } from '../../store/galaxyStore';
import type { DemoId } from '../../types/galaxy';
import { AttentionHeatmapDemo } from './AttentionHeatmapDemo';
import { DemoErrorBoundary } from './DemoErrorBoundary';
import { GradientDescentDemo } from './GradientDescentDemo';
import { NextTokenDemo } from './NextTokenDemo';
import { TokenizerDemo } from './TokenizerDemo';

const DEMOS: { id: DemoId; title: string }[] = [
  { id: 'tokenizer', title: 'Tokenizer' },
  { id: 'attention-heatmap', title: 'Attention' },
  { id: 'gradient-descent', title: 'Gradient Descent' },
  { id: 'next-token-prediction', title: 'Next-Token' },
];

export function DemoModal() {
  const { openDemoId, setOpenDemoId } = useGalaxyStore();

  if (!openDemoId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Interactive concept demo"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpenDemoId(null);
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-800 bg-[#0B1120] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800/80">
          <div>
            <p className="text-xs font-medium text-amber-300">Interactive Micro-Demo</p>
            <h2 className="font-display text-lg font-semibold text-slate-50">
              {DEMOS.find((d) => d.id === openDemoId)?.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpenDemoId(null)}
            aria-label="Close demo"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Switcher tabs across all 4 demos */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 border-b border-slate-800/70 bg-[#080D1A]"
          role="tablist"
          aria-label="Choose interactive demo"
        >
          {DEMOS.map((demo) => {
            const active = demo.id === openDemoId;
            return (
              <button
                key={demo.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setOpenDemoId(demo.id)}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {demo.title}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto galaxy-scroll p-5">
          <DemoErrorBoundary key={openDemoId} onReset={() => setOpenDemoId(openDemoId)}>
            {openDemoId === 'tokenizer' && <TokenizerDemo />}
            {openDemoId === 'attention-heatmap' && <AttentionHeatmapDemo />}
            {openDemoId === 'gradient-descent' && <GradientDescentDemo />}
            {openDemoId === 'next-token-prediction' && <NextTokenDemo />}
          </DemoErrorBoundary>
        </div>
      </div>
    </div>
  );
}
