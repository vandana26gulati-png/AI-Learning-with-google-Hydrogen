import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Send,
  X,
} from 'lucide-react';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';

const DEMO_LABELS: Record<string, string> = {
  tokenizer: 'Tokenizer',
  'attention-heatmap': 'Attention Heatmap',
  'gradient-descent': 'Gradient Descent',
  'next-token-prediction': 'Next-Token Prediction',
};

export function TermPanel() {
  const {
    selectedTermId,
    selectTerm,
    exploredIds,
    toggleExplored,
    eli5Mode,
    setEli5Mode,
    setOpenDemoId,
  } = useGalaxyStore();

  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  // Reset AI Q&A state whenever term changes
  useEffect(() => {
    setQuestion('');
    setAnswer(null);
    setAskError(null);
    setAsking(false);
  }, [selectedTermId]);

  if (!selectedTermId) return null;

  const term = galaxyData.termMap.get(selectedTermId);
  if (!term) return null;

  const cluster = galaxyData.clusterMap.get(term.cluster);
  const isLearned = exploredIds.has(term.id);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking) return;

    setAsking(true);
    setAskError(null);

    try {
      const res = await fetch('/api/ask-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: term.term,
          short: term.short,
          clusterName: cluster?.name ?? term.cluster,
          level: term.level,
          question: trimmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAskError(data.error || 'Unable to answer right now. Please try again later.');
      } else if (typeof data.answer === 'string' && data.answer.trim()) {
        setAnswer(data.answer.trim());
      } else {
        setAskError('No answer returned. Please try a different question.');
      }
    } catch {
      setAskError('Could not reach the tutor service. Check your connection and try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <aside
      aria-label={`Concept details: ${term.term}`}
      className={`pointer-events-auto fixed z-30 flex flex-col border border-slate-800/90 bg-[#0B1120]/94 backdrop-blur-md shadow-2xl transition-all duration-200
        left-0 right-0 bottom-0 rounded-t-3xl
        ${mobileExpanded ? 'max-h-[82vh]' : 'max-h-[50vh]'}
        lg:left-auto lg:top-20 lg:right-5 lg:bottom-4 lg:w-[400px] lg:max-h-none lg:rounded-2xl`}
    >
      {/* Mobile drag / expand handle */}
      <div className="flex lg:hidden items-center justify-center pt-2.5 pb-1">
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          aria-label={mobileExpanded ? 'Collapse term sheet' : 'Expand term sheet'}
          className="flex items-center gap-1.5 px-4 py-1 text-slate-400 hover:text-slate-200"
        >
          <span className="h-1 w-9 rounded-full bg-slate-600" aria-hidden="true" />
          {mobileExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-2 lg:pt-5 pb-3 border-b border-slate-800/80">
        <div className="min-w-0">
          {/* Unboxed metadata line per zero-pill discipline */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
              <span
                className="font-mono text-sm"
                style={{ color: cluster?.color ?? '#38BDF8' }}
                aria-hidden="true"
              >
                {cluster?.symbol ?? '✦'}
              </span>
              <span>{cluster?.name ?? term.cluster}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{term.level}</span>
          </div>

          <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-slate-50 leading-snug">
            {term.term}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => selectTerm(null)}
          aria-label="Close concept panel"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto galaxy-scroll px-5 py-4 space-y-5">
        {/* Definition / ELI5 segmented toggle */}
        <div>
          <div
            className="inline-flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800"
            role="group"
            aria-label="Explanation style"
          >
            <button
              type="button"
              onClick={() => setEli5Mode(false)}
              aria-pressed={!eli5Mode}
              className={`min-h-[34px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                !eli5Mode
                  ? 'bg-slate-800 text-slate-50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plain definition
            </button>
            <button
              type="button"
              onClick={() => setEli5Mode(true)}
              aria-pressed={eli5Mode}
              className={`min-h-[34px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                eli5Mode
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Explain like I'm 5
            </button>
          </div>

          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-slate-100">
            {eli5Mode ? term.eli5 : term.short}
          </p>
        </div>

        {/* Example */}
        <div className="pt-3 border-t border-slate-800/70">
          <h3 className="text-xs font-medium text-slate-400 mb-1.5">Concrete example</h3>
          <p className="text-sm leading-relaxed text-slate-300">{term.example}</p>
        </div>

        {/* Interactive Actions: Demo & Learned */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => toggleExplored(term.id)}
            aria-pressed={isLearned}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              isLearned
                ? 'bg-emerald-500/18 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/25'
                : 'bg-slate-800/90 text-slate-100 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isLearned ? 'Learned' : 'Mark as learned'}</span>
          </button>

          {term.demo && (
            <button
              type="button"
              onClick={() => setOpenDemoId(term.demo!)}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/45 px-4 text-xs sm:text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 whitespace-nowrap"
            >
              <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Open demo: {DEMO_LABELS[term.demo] ?? 'Try it'}</span>
            </button>
          )}
        </div>

        {/* Related concepts */}
        {term.related.length > 0 && (
          <div className="pt-3 border-t border-slate-800/70">
            <h3 className="text-xs font-medium text-slate-400 mb-2.5">
              Connected concepts (tap to fly)
            </h3>
            <div className="flex flex-wrap gap-2">
              {term.related.map((relId) => {
                const relTerm = galaxyData.termMap.get(relId);
                if (!relTerm) return null;
                const relCluster = galaxyData.clusterMap.get(relTerm.cluster);
                return (
                  <button
                    key={relId}
                    type="button"
                    onClick={() => selectTerm(relId, { autoMarkExplored: true })}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-800"
                  >
                    <span
                      className="font-mono text-xs"
                      style={{ color: relCluster?.color ?? '#38BDF8' }}
                      aria-hidden="true"
                    >
                      {relCluster?.symbol ?? '✦'}
                    </span>
                    <span>{relTerm.term}</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-500" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ask about this term (Gemini API) */}
        <div className="pt-3 border-t border-slate-800/70">
          <h3 className="text-xs font-medium text-slate-400 mb-2">
            Ask about this term
          </h3>
          <form onSubmit={handleAsk} className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={400}
              placeholder={`Ask a follow-up about ${term.term}...`}
              aria-label={`Ask a question about ${term.term}`}
              className="h-11 flex-1 rounded-xl border border-slate-800 bg-[#060913]/90 px-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!question.trim() || asking}
              aria-label="Send question"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 transition-colors hover:bg-cyan-500/30 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {asking && (
            <p className="mt-2.5 text-xs text-slate-400">
              Thinking about {term.term}...
            </p>
          )}

          {askError && (
            <p className="mt-2.5 text-xs text-rose-300 leading-relaxed" role="status">
              {askError}
            </p>
          )}

          {answer && !asking && (
            <div className="mt-3 rounded-xl border border-slate-800 bg-[#060913]/80 p-3 text-xs sm:text-sm leading-relaxed text-slate-200">
              {answer}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
