'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import { GraphCanvas } from '@/components/GraphCanvas';
import { HubHighlights } from '@/components/HubHighlights';
import { KnowledgeSystemsPanel } from '@/components/KnowledgeSystemsPanel';
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
        <article className='rounded-[32px] border border-theme-border-strong bg-theme-hero p-6 shadow-theme-glow md:p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.32em] text-theme-primary'>Knowledge Navigation</p>
          <h1 className='mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-theme-text md:text-5xl'>
            Explore Wikipedia as a subway system with routes, hubs, line filters, and transfer-heavy ideas.
          </h1>
          <p className='mt-4 max-w-3xl text-sm leading-6 text-theme-muted md:text-base'>
            Visualize how your mind explores knowledge: build personalized maps, join challenges, compare rankings, and share your journey.
          </p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/route'
              className='rounded-full bg-theme-primary px-4 py-2.5 text-sm font-semibold text-theme-bg shadow-theme-soft hover:bg-theme-secondary hover:text-theme-text'
            >
              Open Route Planner
            </Link>
            <Link
              href='/line/technology'
              className='rounded-full border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-semibold text-theme-text hover:border-theme-primary hover:text-theme-primary'
            >
              Browse a Line
            </Link>

            <button
              type='button'
              onClick={() => {
                if (!graph?.nodes.length) return;
                const randomNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)];
                subwayActions.selectNode(randomNode.id);
              }}
              className='rounded-full border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-semibold text-theme-text hover:border-theme-primary hover:text-theme-primary'
            >
              Random Start
            </button>
          </div>
        </article>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-2'>
          <div className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
            <p className='text-xs uppercase tracking-[0.28em] text-theme-soft'>Stations</p>
            <p className='mt-3 text-3xl font-semibold text-theme-text'>{stats?.node_count ?? '...'}</p>
            <p className='mt-2 text-sm text-theme-muted'>Articles currently laid out as subway stops.</p>
          </div>
          <div className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
            <p className='text-xs uppercase tracking-[0.28em] text-theme-soft'>Links</p>
            <p className='mt-3 text-3xl font-semibold text-theme-text'>{stats?.edge_count ?? '...'}</p>
            <p className='mt-2 text-sm text-theme-muted'>Connections used for routing and local exploration.</p>
          </div>
          <div className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
            <p className='text-xs uppercase tracking-[0.28em] text-theme-soft'>Lines</p>
            <p className='mt-3 text-3xl font-semibold text-theme-text'>{stats?.cluster_count ?? '...'}</p>
            <p className='mt-2 text-sm text-theme-muted'>Topic corridors that make the graph readable at a glance.</p>
          </div>
          <div className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
            <p className='text-xs uppercase tracking-[0.28em] text-theme-soft'>Active filter</p>
            <p className='mt-3 text-2xl font-semibold text-theme-text'>{activeLineId ? humanizeCluster(activeLineId) : 'All lines'}</p>
            <p className='mt-2 text-sm text-theme-muted'>Choose a line below to isolate one knowledge corridor.</p>
          </div>
        </div>
      </div>

      {error ? <p className='rounded-xl border border-theme-danger bg-theme-danger-soft p-3 text-sm text-theme-danger'>{error}</p> : null}

      <KnowledgeSystemsPanel />

      <LineExplorer />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SearchBar />
        {stats ? (
          <p className='text-xs text-theme-muted'>
            {stats.node_count} stations - {stats.edge_count} links - {stats.cluster_count} lines
          </p>
        ) : null}
      </div>

      <RouteViewer />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_340px]'>
        {graph ? (
          <GraphCanvas />
        ) : (
          <div className='h-[72vh] rounded-xl border border-theme-border bg-theme-panel p-4 text-theme-muted shadow-theme-soft'>Loading graph...</div>
        )}
        <StationPanel />
      </div>

      <HubHighlights />
    </section>
  );
}
