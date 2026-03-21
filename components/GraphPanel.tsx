'use client';

import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import { GraphCanvas } from '@/components/GraphCanvas';
import { RouteViewer } from '@/components/RouteViewer';
import { SearchBar } from '@/components/SearchBar';
import { StationPanel } from '@/components/StationPanel';

export function GraphPanel() {
  const graph = useSubwayStore((state) => state.graph);
  const stats = useSubwayStore((state) => state.stats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [graphData, statsData] = await Promise.all([backendApi.getGraph(), backendApi.getStats()]);
        if (!active) return;
        subwayActions.setGraph(graphData);
        subwayActions.setStats(statsData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to bootstrap frontend graph');
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SearchBar />
        {stats ? (
          <p className='text-xs text-slate-400'>
            {stats.node_count} stations · {stats.edge_count} links · {stats.cluster_count} lines
          </p>
        ) : null}
      </div>

      {error ? <p className='rounded bg-red-900/40 p-3 text-sm text-red-200'>{error}</p> : null}

      <RouteViewer />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_340px]'>
        {graph ? <GraphCanvas /> : <div className='h-[72vh] rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-slate-400'>Loading graph…</div>}
        <StationPanel />
      </div>
    </section>
  );
}
