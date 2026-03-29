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
    <section className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-strong'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-theme-highlight'>Route Planner</p>
          <h2 className='text-xl font-semibold text-theme-text'>Find the shortest conceptual route between two stations.</h2>
          <p className='max-w-2xl text-sm text-theme-muted'>
            Enter article titles or ids. The planner resolves them against the current graph and returns the shortest path, the lines it crosses,
            and the transfer intensity of the trip.
          </p>
        </div>
        <Link href='/route' className='text-sm font-medium text-theme-primary hover:text-theme-secondary'>
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
          className='rounded-xl border border-theme-border bg-theme-subcard px-3 py-3 text-sm text-theme-text shadow-theme-soft focus:border-theme-primary focus:outline-none'
        />
        <input
          list='station-options'
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          suppressHydrationWarning
          placeholder='End station title or id'
          className='rounded-xl border border-theme-border bg-theme-subcard px-3 py-3 text-sm text-theme-text shadow-theme-soft focus:border-theme-primary focus:outline-none'
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
          className='rounded-full bg-theme-highlight px-4 py-2.5 text-sm font-semibold text-theme-bg shadow-theme-soft hover:bg-theme-primary hover:text-theme-text'
        >
          {loading ? 'Finding route...' : 'Find shortest path'}
        </button>
        {summary ? (
          <p className='text-sm text-theme-muted'>
            {summary.distance} stops - {summary.line_change_count} line changes - {summary.clusters.map(humanizeCluster).join(' -> ')}
          </p>
        ) : null}
      </div>

      {error ? <p className='mt-3 text-sm text-theme-danger'>{error}</p> : null}

      {routePath.length > 0 ? (
        <div className='mt-4 rounded-2xl border border-theme-border bg-theme-subcard p-4'>
          <p className='text-xs uppercase tracking-[0.24em] text-theme-soft'>Route steps</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className='flex items-center gap-2'>
                  <Link
                    href={`/station/${encodeURIComponent(step.id)}`}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      step.is_transfer
                        ? 'border-theme-transfer bg-theme-transfer-soft text-theme-transfer hover:border-theme-highlight'
                        : 'border-theme-border bg-theme-card text-theme-text hover:border-theme-primary hover:text-theme-primary'
                    }`}
                  >
                    {step.title}
                  </Link>
                  {!isLast ? <span className='text-theme-soft'>-&gt;</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
