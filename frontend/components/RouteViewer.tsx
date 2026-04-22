'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import type { BackendRouteStep } from '@/types/backend';

function normalizeLookup(value: string): string {
  return value.trim().replace(/[\s-]+/g, '_').replace(/_+/g, '_').toLowerCase();
}

export function RouteViewer() {
  const graph = useSubwayStore((state) => state.graph);
  const routePath = useSubwayStore((state) => state.routePath);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<BackendRouteStep[]>([]);
  const [summary, setSummary] = useState<{ distance: number; line_change_count: number; clusters: string[] } | null>(null);

  useEffect(() => {
    if (graph) {
      return;
    }

    let active = true;
    const loadGraph = async () => {
      try {
        const graphData = await backendApi.getGraph();
        if (!active) return;
        subwayActions.setGraph(graphData);
      } catch {
        // Keep the planner usable even if graph bootstrap fails later on user action.
      }
    };

    void loadGraph();
    return () => {
      active = false;
    };
  }, [graph]);

  const graphLookup = useMemo(() => {
    const byLookup = new Map<string, string>();
    const options =
      graph?.nodes
        .slice()
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((node) => {
          byLookup.set(normalizeLookup(node.id), node.id);
          byLookup.set(normalizeLookup(node.label), node.id);
          return node;
        }) ?? [];

    return { byLookup, options };
  }, [graph]);

  async function findRoute() {
    const startId = graphLookup.byLookup.get(normalizeLookup(start));
    const endId = graphLookup.byLookup.get(normalizeLookup(end));

    if (!startId || !endId) {
      setError('Choose valid start and end stations by title or id.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getRoute(startId, endId);
      subwayActions.setRouteEndpoints(startId, endId);
      subwayActions.setRoutePath(response.path);
      setSteps(response.steps);
      setSummary({
        distance: response.distance,
        line_change_count: response.line_change_count,
        clusters: response.clusters,
      });
      if (response.path.length > 0) subwayActions.selectNode(response.path[response.path.length - 1]);
    } catch (err) {
      subwayActions.setRoutePath([]);
      setSteps([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : 'Unable to compute route.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className='rounded-lg border border-theme-border bg-theme-card p-4 shadow-theme-soft md:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-theme-border pb-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Shortest Path</p>
          <h2 className='mt-1 text-lg font-semibold text-theme-text'>Find Shortest Path</h2>
        </div>
        <Link href='/route' className='rounded-md border border-theme-border bg-theme-subcard px-3 py-2 text-sm font-medium text-theme-primary hover:border-theme-primary'>
          Full planner
        </Link>
      </div>

      <div className='mt-4 grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]'>
        <label className='block text-xs font-medium text-theme-muted'>
          From
          <input
            list='station-options'
            value={start}
            onChange={(event) => setStart(event.target.value)}
            suppressHydrationWarning
            placeholder='Albert Einstein'
            className='mt-2 h-11 w-full rounded-md border border-theme-border bg-theme-subcard px-3 text-sm text-theme-text shadow-theme-soft focus:border-theme-primary focus:outline-none'
          />
        </label>
        <button
          type='button'
          aria-label='Swap route endpoints'
          title='Swap route endpoints'
          onClick={() => {
            setStart(end);
            setEnd(start);
          }}
          className='hidden h-11 w-11 items-center justify-center rounded-md border border-theme-border bg-theme-subcard text-theme-muted hover:border-theme-primary hover:text-theme-primary md:flex'
        >
          <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
            <path d='M8 7h10' />
            <path d='m15 4 3 3-3 3' />
            <path d='M16 17H6' />
            <path d='m9 14-3 3 3 3' />
          </svg>
        </button>
        <label className='block text-xs font-medium text-theme-muted'>
          To
          <input
            list='station-options'
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            suppressHydrationWarning
            placeholder='Quantum Mechanics'
            className='mt-2 h-11 w-full rounded-md border border-theme-border bg-theme-subcard px-3 text-sm text-theme-text shadow-theme-soft focus:border-theme-primary focus:outline-none'
          />
        </label>
      </div>

      <datalist id='station-options'>
        {graphLookup.options.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>

      <div className='mt-4 flex flex-wrap items-center gap-3'>
        <button
          type='button'
          onClick={() => void findRoute()}
          suppressHydrationWarning
          className='inline-flex h-11 items-center justify-center rounded-md bg-theme-primary px-4 text-sm font-semibold text-white shadow-theme-soft hover:bg-theme-secondary'
        >
          {loading ? 'Finding...' : 'Find Path'}
        </button>
        {summary ? (
          <p className='text-sm text-theme-muted'>
            {summary.distance} stops - {summary.line_change_count} line changes - {summary.clusters.map(humanizeCluster).join(' / ')}
          </p>
        ) : null}
      </div>

      {error ? <p className='mt-3 text-sm text-theme-danger'>{error}</p> : null}

      {routePath.length > 0 ? (
        <div className='mt-5 space-y-4 rounded-lg border border-theme-border bg-theme-subcard p-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Shortest Path Found</p>
            <div className='mt-4 overflow-x-auto pb-2'>
              <div className='flex min-w-max items-start'>
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1;
                  return (
                    <div key={step.id} className='flex items-start'>
                      <Link href={`/station/${encodeURIComponent(step.id)}`} className='group flex w-24 flex-col items-center text-center'>
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-theme-card text-xs font-semibold ${
                            step.is_transfer ? 'border-theme-transfer text-theme-transfer' : 'border-theme-primary text-theme-primary'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className='mt-2 line-clamp-2 text-xs font-medium text-theme-text group-hover:text-theme-primary'>{step.title}</span>
                      </Link>
                      {!isLast ? <span className='mt-5 h-0.5 w-14 bg-theme-highlight' /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='grid gap-3 border-t border-theme-border pt-4 text-center text-sm md:grid-cols-3'>
            <div>
              <p className='text-xs text-theme-muted'>Total Stations</p>
              <p className='mt-1 text-lg font-semibold text-theme-text'>{steps.length}</p>
            </div>
            <div>
              <p className='text-xs text-theme-muted'>Total Connections</p>
              <p className='mt-1 text-lg font-semibold text-theme-text'>{summary?.distance ?? 0}</p>
            </div>
            <div>
              <p className='text-xs text-theme-muted'>Path Length</p>
              <p className='mt-1 text-lg font-semibold text-theme-text'>{Math.max(0, steps.length - 1)}</p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className='flex items-center gap-2'>
                  <Link
                    href={`/station/${encodeURIComponent(step.id)}`}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      step.is_transfer
                        ? 'border-theme-transfer bg-theme-transfer-soft text-theme-transfer hover:border-theme-highlight'
                        : 'border-theme-border bg-theme-card text-theme-text hover:border-theme-primary hover:text-theme-primary'
                    }`}
                  >
                    {step.title}
                  </Link>
                  {!isLast ? <span className='text-theme-soft'>/</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
