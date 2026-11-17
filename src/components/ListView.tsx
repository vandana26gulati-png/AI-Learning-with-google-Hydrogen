import React, { useMemo } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { galaxyData } from '../data/loadData';
import { useGalaxyStore } from '../store/galaxyStore';

export function ListView() {
  const {
    matchingTermIds,
    exploredIds,
    selectedTermId,
    selectTerm,
    clearAllFilters,
    hasActiveFilters,
  } = useGalaxyStore();

  const grouped = useMemo(() => {
    return galaxyData.clusters
      .map((cluster) => {
        const items = galaxyData.terms.filter(
          (t) => t.cluster === cluster.id && matchingTermIds.has(t.id)
        );
        return { cluster, items };
      })
      .filter((g) => g.items.length > 0);
  }, [matchingTermIds]);

  return (
    <main
      className="h-full w-full overflow-y-auto galaxy-scroll bg-[#060913] pt-20 pb-28 px-4 sm:px-6 lg:px-10"
      aria-label="Accessible concept directory"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-50">
              Concept Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Keyboard-accessible catalog of {matchingTermIds.size} concepts across{' '}
              {grouped.length} clusters.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-700 text-xs font-medium text-cyan-300 hover:bg-slate-800/80"
            >
              Clear filters
            </button>
          )}
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0B1120] p-8 text-center">
            <p className="text-base font-medium text-slate-200">No matching concepts found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try a broader search term or reset your active filters.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 min-h-[44px] px-4 rounded-xl bg-cyan-500/20 text-sm font-medium text-cyan-200 hover:bg-cyan-500/30"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ cluster, items }) => (
              <section key={cluster.id} aria-labelledby={`cluster-heading-${cluster.id}`}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2
                    id={`cluster-heading-${cluster.id}`}
                    className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2"
                  >
                    <span className="font-mono" style={{ color: cluster.color }} aria-hidden="true">
                      {cluster.symbol}
                    </span>
                    <span>{cluster.name}</span>
                  </h2>
                  <span className="font-mono text-xs text-slate-400">
                    {items.length} / {cluster.targetCount}
                  </span>
                </div>

                <ul className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800/80 bg-[#0B1120]/70 overflow-hidden">
                  {items.map((term) => {
                    const explored = exploredIds.has(term.id);
                    const selected = selectedTermId === term.id;
                    return (
                      <li key={term.id}>
                        <button
                          type="button"
                          onClick={() => selectTerm(term.id, { autoMarkExplored: true })}
                          aria-current={selected ? 'true' : undefined}
                          className={`flex w-full min-h-[56px] items-center justify-between gap-4 px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-400 ${
                            selected
                              ? 'bg-cyan-500/12'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                              <span className="font-display text-sm sm:text-base font-medium text-slate-100">
                                {term.term}
                              </span>
                              <span className="text-xs text-slate-400 capitalize">
                                · {term.level}
                              </span>
                              {term.demo && (
                                <span className="text-xs text-amber-300">
                                  · Interactive demo
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-slate-400 line-clamp-2">
                              {term.short}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {explored && (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300"
                                aria-label="Learned"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span className="hidden sm:inline">Learned</span>
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
