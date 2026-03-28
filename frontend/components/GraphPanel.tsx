'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import { GraphCanvas } from '@/components/GraphCanvas';
import { HubHighlights } from '@/components/HubHighlights';
import { LineExplorer } from '@/components/LineExplorer';
import { RouteViewer } from '@/components/RouteViewer';
import { SearchBar } from '@/components/SearchBar';
import { StationPanel } from '@/components/StationPanel';

export function GraphPanel() {
  const graph = useSubwayStore((state) => state.graph);
  const stats = useSubwayStore((state) => state.stats);
  const activeLineId = useSubwayStore((state) => state.activeLineId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [graphData, statsData, linesData] = await Promise.all([backendApi.getGraph(), backendApi.getStats(), backendApi.getLines()]);
        if (!active) return;
        subwayActions.setGraph(graphData);
        subwayActions.setStats(statsData);
        subwayActions.setLines(linesData.lines);
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
    <section className='space-y-6'>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]'>
        <article className='rounded-[32px] border border-slate-800 bg-[linear-gradient(135deg,rgba(14,116,144,0.22),rgba(15,23,42,0.94),rgba(217,119,6,0.16))] p-6 shadow-[0_30px_90px_-55px_rgba(56,189,248,0.75)] md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200'>Knowledge Navigation</p>
          <h1 className='mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl'>
            Explore Wikipedia as a subway system with routes, hubs, line filters, and transfer-heavy ideas.
          </h1>
          <p className='mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base'>
            The explorer now pairs the live graph with line overviews and station pages, so the repository feels more like a product that
            supports navigation, not just visualization.
          </p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/route'
              className='rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300'
            >
              Open Route Planner
            </Link>
            <Link
              href='/line/technology'
              className='rounded-full border border-slate-600 bg-slate-950/35 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/70 hover:text-cyan-200'
            >
              Browse a Line
            </Link>
          </div>
        </article>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-2'>
          <div className='rounded-[28px] border border-slate-800 bg-slate-900/80 p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Stations</p>
            <p className='mt-3 text-3xl font-semibold text-slate-50'>{stats?.node_count ?? '...'}</p>
            <p className='mt-2 text-sm text-slate-400'>Articles currently laid out as subway stops.</p>
          </div>
          <div className='rounded-[28px] border border-slate-800 bg-slate-900/80 p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Links</p>
            <p className='mt-3 text-3xl font-semibold text-slate-50'>{stats?.edge_count ?? '...'}</p>
            <p className='mt-2 text-sm text-slate-400'>Connections used for routing and local exploration.</p>
          </div>
          <div className='rounded-[28px] border border-slate-800 bg-slate-900/80 p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Lines</p>
            <p className='mt-3 text-3xl font-semibold text-slate-50'>{stats?.cluster_count ?? '...'}</p>
            <p className='mt-2 text-sm text-slate-400'>Topic corridors that make the graph readable at a glance.</p>
          </div>
          <div className='rounded-[28px] border border-slate-800 bg-slate-900/80 p-5'>
            <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Active filter</p>
            <p className='mt-3 text-2xl font-semibold text-slate-50'>{activeLineId ? humanizeCluster(activeLineId) : 'All lines'}</p>
            <p className='mt-2 text-sm text-slate-400'>Choose a line below to isolate one knowledge corridor.</p>
          </div>
        </div>
      </div>

      {error ? <p className='rounded bg-red-900/40 p-3 text-sm text-red-200'>{error}</p> : null}

      <LineExplorer />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SearchBar />
        {stats ? (
          <p className='text-xs text-slate-400'>
            {stats.node_count} stations · {stats.edge_count} links · {stats.cluster_count} lines
          </p>
        ) : null}
      </div>

      <RouteViewer />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_340px]'>
        {graph ? <GraphCanvas /> : <div className='h-[72vh] rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-slate-400'>Loading graph...</div>}
        <StationPanel />
      </div>

      <HubHighlights />
    </section>
  );
}
