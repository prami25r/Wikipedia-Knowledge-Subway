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
    <section className='rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 shadow-[0_20px_60px_-40px_rgba(245,158,11,0.55)]'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-amber-300'>Route Planner</p>
          <h2 className='text-xl font-semibold text-slate-50'>Find the shortest conceptual route between two stations.</h2>
          <p className='max-w-2xl text-sm text-slate-400'>
            Enter article titles or ids. The planner resolves them against the current graph and returns the shortest path, the lines it crosses,
            and the transfer intensity of the trip.
          </p>
        </div>
        <Link href='/route' className='text-sm font-medium text-cyan-300 transition hover:text-cyan-200'>
          Open dedicated planner
        </Link>
      </div>

      <div className='mt-4 grid grid-cols-1 gap-2 md:grid-cols-2'>
        <input
          list='station-options'
          value={start}
          onChange={(event) => setStart(event.target.value)}
          suppressHydrationWarning
          placeholder='Start station title or id'
          className='rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100'
        />
        <input
          list='station-options'
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          suppressHydrationWarning
          placeholder='End station title or id'
          className='rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100'
        />
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
          className='rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300'
        >
          {loading ? 'Finding route...' : 'Find shortest path'}
        </button>
        {summary ? (
          <p className='text-sm text-slate-300'>
            {summary.distance} stops · {summary.line_change_count} line changes · {summary.clusters.map(humanizeCluster).join(' -> ')}
          </p>
        ) : null}
      </div>

      {error ? <p className='mt-3 text-sm text-red-300'>{error}</p> : null}

      {routePath.length > 0 ? (
        <div className='mt-4 rounded-2xl border border-slate-800 bg-slate-950/75 p-4'>
          <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Route steps</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className='flex items-center gap-2'>
                  <Link
                    href={`/station/${encodeURIComponent(step.id)}`}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      step.is_transfer ? 'border-amber-500/70 text-amber-100 hover:border-amber-400' : 'border-slate-700 text-slate-200 hover:border-cyan-500/70 hover:text-cyan-200'
                    }`}
                  >
                    {step.title}
                  </Link>
                  {!isLast ? <span className='text-slate-500'>→</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
