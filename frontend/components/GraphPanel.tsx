'use client';

import { useEffect, useMemo, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import { GraphCanvas } from '@/components/GraphCanvas';
import { HubHighlights } from '@/components/HubHighlights';
import { KnowledgeSystemsPanel } from '@/components/KnowledgeSystemsPanel';
import { LineExplorer } from '@/components/LineExplorer';
import { RouteViewer } from '@/components/RouteViewer';
import { SearchBar } from '@/components/SearchBar';
import { StationPanel } from '@/components/StationPanel';

const featureCards = [
  {
    title: 'Subway Visualization',
    copy: 'Topics are stations, and article links become readable transit connections.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
        <path d='M7 17h10' />
        <path d='M8 21h8' />
        <path d='M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z' />
        <path d='M8 7h8' />
        <path d='M8 12h.01' />
        <path d='M16 12h.01' />
      </svg>
    ),
  },
  {
    title: 'Shortest Knowledge Path',
    copy: 'Find the smallest conceptual trip between two Wikipedia topics.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
        <path d='M4 18c5-12 11 0 16-12' />
        <path d='M14 6h6v6' />
      </svg>
    ),
  },
  {
    title: 'Wikipedia Powered',
    copy: 'All stations and connections come from the graph behind the app.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
        <path d='M7 4h10' />
        <path d='M9 4v16' />
        <path d='M15 4v16' />
        <path d='M5 20h14' />
      </svg>
    ),
  },
];

function lineColor(index: number): string {
  return `var(--theme-line-${(index % 8) + 1})`;
}

function scrollToMap() {
  document.getElementById('subway-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function GraphPanel() {
  const graph = useSubwayStore((state) => state.graph);
  const stats = useSubwayStore((state) => state.stats);
  const lines = useSubwayStore((state) => state.lines);
  const activeLineId = useSubwayStore((state) => state.activeLineId);
  const selectedNodeId = useSubwayStore((state) => state.selectedNodeId);
  const routePath = useSubwayStore((state) => state.routePath);
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

  const activeLine = useMemo(() => lines.find((line) => line.id === activeLineId) ?? null, [activeLineId, lines]);
  const selectedNode = useMemo(() => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null, [graph, selectedNodeId]);
  const routeStops = useMemo(
    () =>
      routePath
        .map((id) => {
          const node = graph?.nodes.find((entry) => entry.id === id);
          return node ? { id: node.id, title: node.label, cluster: node.cluster } : { id, title: id, cluster: '' };
        })
        .slice(0, 6),
    [graph, routePath],
  );
  const popularStations = useMemo(() => {
    if (stats?.top_hubs.length) return stats.top_hubs.slice(0, 5);
    return (
      graph?.nodes.slice(0, 5).map((node) => ({
        id: node.id,
        title: node.label,
        cluster: node.cluster,
        degree: node.degree,
      })) ?? []
    );
  }, [graph, stats]);

  const focusStation = (stationId: string) => {
    subwayActions.selectNode(stationId);
    scrollToMap();
  };

  return (
    <section className='space-y-5'>
      <section className='metro-hero-bg rounded-lg border border-theme-border bg-theme-card px-5 py-10 shadow-theme-soft md:px-8 md:py-14'>
        <div className='mx-auto flex max-w-3xl flex-col items-center text-center'>
          <h1 className='text-4xl font-semibold leading-tight tracking-normal text-theme-text md:text-5xl'>Explore Wikipedia like a Subway</h1>
          <p className='mt-4 max-w-xl text-sm leading-6 text-theme-muted md:text-base'>
            Pick a topic and travel through related ideas as stations, lines, transfers, and shortest paths.
          </p>
          <SearchBar
            buttonLabel='Go'
            className='mt-7 max-w-2xl'
            onSelect={focusStation}
            placeholder='Enter a Wikipedia topic...'
            showButton
            variant='hero'
          />

          {popularStations.length > 0 ? (
            <div className='mt-6 flex w-full flex-col items-center gap-3'>
              <p className='text-xs font-semibold text-theme-muted'>Popular Stations</p>
              <div className='flex flex-wrap justify-center gap-2'>
                {popularStations.map((station) => (
                  <button
                    key={station.id}
                    type='button'
                    onClick={() => focusStation(station.id)}
                    className='rounded-md border border-theme-border bg-theme-panel px-3 py-1.5 text-xs text-theme-muted hover:border-theme-primary hover:text-theme-primary'
                  >
                    {station.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className='mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-3'>
          {featureCards.map((card) => (
            <article key={card.title} className='rounded-lg border border-theme-border bg-theme-panel p-5 text-center shadow-theme-soft'>
              <div className='mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-theme-primary-soft text-theme-primary'>{card.icon}</div>
              <h2 className='mt-4 text-sm font-semibold text-theme-text'>{card.title}</h2>
              <p className='mt-2 text-sm leading-5 text-theme-muted'>{card.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {error ? <p className='rounded-lg border border-theme-danger bg-theme-danger-soft p-3 text-sm text-theme-danger'>{error}</p> : null}

      <section id='subway-map' className='overflow-hidden rounded-lg border border-theme-border bg-theme-card shadow-theme-strong'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-theme-border px-4 py-3 md:px-5'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Search Results / Subway Map</p>
            <h2 className='mt-1 text-base font-semibold text-theme-text'>Interactive Knowledge Subway</h2>
          </div>
          <SearchBar
            buttonLabel='Search'
            className='w-full max-w-xl md:w-[min(48vw,560px)]'
            onSelect={focusStation}
            placeholder='Search any topic...'
            showButton
            variant='compact'
          />
        </div>

        <div className='grid lg:grid-cols-[290px_minmax(0,1fr)]'>
          <aside className='space-y-4 border-b border-theme-border bg-theme-panel p-4 lg:border-b-0 lg:border-r'>
            <div className='rounded-lg border border-theme-border bg-theme-card p-4'>
              <h3 className='text-sm font-semibold text-theme-text'>Your Journey</h3>
              <p className='mt-2 text-xs text-theme-muted'>
                From: {routeStops[0]?.title ?? selectedNode?.label ?? 'Choose a station'}
              </p>
              <div className='mt-4 space-y-3'>
                {(routeStops.length > 0 ? routeStops : selectedNode ? [{ id: selectedNode.id, title: selectedNode.label, cluster: selectedNode.cluster }] : []).map(
                  (stop, index) => (
                    <button
                      key={`${stop.id}-${index}`}
                      type='button'
                      onClick={() => focusStation(stop.id)}
                      className='flex w-full items-center gap-3 text-left text-sm text-theme-text hover:text-theme-primary'
                    >
                      <span
                        className='h-3 w-3 rounded-full border-2 bg-theme-card'
                        style={{ borderColor: routeStops.length > 0 ? lineColor(index) : 'var(--theme-line-primary)' }}
                      />
                      <span className='min-w-0 flex-1 truncate'>{stop.title}</span>
                    </button>
                  ),
                )}
                {!selectedNode && routeStops.length === 0 ? <p className='text-sm text-theme-muted'>Search or click a station to begin.</p> : null}
              </div>
            </div>

            <div className='rounded-lg border border-theme-border bg-theme-card p-4'>
              <h3 className='text-sm font-semibold text-theme-text'>Path Details</h3>
              <dl className='mt-3 space-y-2 text-sm'>
                <div className='flex justify-between gap-4'>
                  <dt className='text-theme-muted'>Total Stations</dt>
                  <dd className='font-medium text-theme-text'>{routeStops.length || (selectedNode ? 1 : 0)}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-theme-muted'>Total Connections</dt>
                  <dd className='font-medium text-theme-text'>{stats?.edge_count ?? '...'}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-theme-muted'>Active Line</dt>
                  <dd className='max-w-[120px] truncate text-right font-medium text-theme-text'>{activeLine?.name ?? 'All lines'}</dd>
                </div>
              </dl>
              <button
                type='button'
                onClick={() => {
                  subwayActions.setActiveLine(null);
                  scrollToMap();
                }}
                className='mt-4 w-full rounded-md border border-theme-border bg-theme-subcard px-3 py-2 text-sm font-medium text-theme-primary hover:border-theme-primary'
              >
                New Search
              </button>
            </div>

            {lines.length > 0 ? (
              <div className='rounded-lg border border-theme-border bg-theme-card p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h3 className='text-sm font-semibold text-theme-text'>Lines</h3>
                  <button
                    type='button'
                    onClick={() => subwayActions.setActiveLine(null)}
                    className='text-xs font-medium text-theme-primary hover:text-theme-secondary'
                  >
                    All
                  </button>
                </div>
                <div className='mt-3 space-y-2'>
                  {lines.slice(0, 6).map((line, index) => {
                    const active = activeLineId === line.id;
                    return (
                      <button
                        key={line.id}
                        type='button'
                        onClick={() => subwayActions.setActiveLine(active ? null : line.id)}
                        className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm ${
                          active ? 'bg-theme-primary-soft text-theme-primary' : 'text-theme-muted hover:bg-theme-subcard hover:text-theme-text'
                        }`}
                      >
                        <span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: lineColor(index) }} />
                        <span className='min-w-0 flex-1 truncate'>{line.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </aside>

          <div className='relative p-3 md:p-4'>
            {graph ? (
              <>
                <GraphCanvas />
                {lines.length > 0 ? (
                  <div className='absolute bottom-6 right-6 hidden w-32 rounded-lg border border-theme-border bg-theme-panel p-3 shadow-theme-soft backdrop-blur md:block'>
                    <div className='space-y-2'>
                      {lines.slice(0, 6).map((line, index) => (
                        <div key={line.id} className='flex items-center gap-2 text-xs text-theme-muted'>
                          <span className='h-1 w-5 rounded-full' style={{ backgroundColor: lineColor(index) }} />
                          <span>Line {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className='metro-map-grid h-[68vh] min-h-[460px] rounded-lg border border-theme-border bg-theme-subcard p-4 text-theme-muted shadow-theme-soft'>
                Loading graph...
              </div>
            )}
          </div>
        </div>
      </section>

      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <RouteViewer />
        <StationPanel />
      </div>

      <LineExplorer />
      <HubHighlights />
      <KnowledgeSystemsPanel />
    </section>
  );
}
