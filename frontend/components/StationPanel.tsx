'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';

export function StationPanel() {
  const selectedNodeId = useSubwayStore((state) => state.selectedNodeId);
  const station = useSubwayStore((state) => state.station);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedNodeId) {
        subwayActions.setStation(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await backendApi.getStation(selectedNodeId);
        if (active) subwayActions.setStation(data);
      } catch (err) {
        if (active) {
          subwayActions.setStation(null);
          setError(err instanceof Error ? err.message : 'Failed to load station');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [selectedNodeId]);

  if (!selectedNodeId) {
    return (
      <aside className='rounded-[24px] border border-theme-border bg-theme-panel p-5 text-sm text-theme-muted shadow-theme-soft'>
        Select a station in the graph or search results to inspect its line, neighbors, and transfer potential.
      </aside>
    );
  }

  return (
    <aside className='rounded-[24px] border border-theme-border bg-theme-panel p-5 shadow-theme-glow'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='text-xs uppercase tracking-[0.28em] text-theme-primary'>Station Details</p>
          {station ? <h3 className='mt-2 text-xl font-semibold text-theme-text'>{station.title}</h3> : null}
        </div>
        {station ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              station.is_transfer_station
                ? 'border-theme-transfer bg-theme-transfer-soft text-theme-transfer'
                : 'border-theme-primary bg-theme-primary-soft text-theme-primary'
            }`}
          >
            {station.is_transfer_station ? 'Transfer station' : 'Single-line station'}
          </span>
        ) : null}
      </div>

      {loading ? <p className='mt-4 text-sm text-theme-muted'>Loading...</p> : null}
      {error ? <p className='mt-4 text-sm text-theme-danger'>{error}</p> : null}

      {station ? (
        <div className='mt-4 space-y-4 text-sm'>
          <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-theme-text'>{humanizeCluster(station.cluster)} Line</p>
              <Link href={`/line/${encodeURIComponent(station.cluster)}`} className='text-theme-primary hover:text-theme-secondary'>
                Open line
              </Link>
            </div>
            <p className='mt-3 text-theme-muted'>{station.summary || 'No summary available for this station yet.'}</p>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
              <p className='text-theme-soft'>Degree</p>
              <p className='mt-2 text-2xl font-semibold text-theme-text'>{station.degree}</p>
            </div>
            <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
              <p className='text-theme-soft'>Neighbors</p>
              <p className='mt-2 text-2xl font-semibold text-theme-text'>{station.neighbors.length}</p>
            </div>
          </div>

          <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
            <p className='text-theme-soft'>Neighbor lines</p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {station.neighbor_clusters.length > 0 ? (
                station.neighbor_clusters.map((entry) => (
                  <span key={entry.cluster} className='rounded-full border border-theme-border bg-theme-card px-3 py-1 text-xs text-theme-text'>
                    {humanizeCluster(entry.cluster)} - {entry.count}
                  </span>
                ))
              ) : (
                <span className='text-theme-muted'>No connected lines available.</span>
              )}
            </div>
          </div>

          <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
            <p className='text-theme-soft'>Categories</p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {station.categories.length > 0 ? (
                station.categories.slice(0, 8).map((category) => (
                  <span key={category} className='rounded-full border border-theme-border bg-theme-card px-3 py-1 text-xs text-theme-text'>
                    {category}
                  </span>
                ))
              ) : (
                <span className='text-theme-muted'>No categories captured yet.</span>
              )}
            </div>
          </div>

          <div className='rounded-2xl border border-theme-border bg-theme-subcard p-4'>
            <p className='text-theme-soft'>Connected stations</p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {station.neighbors.slice(0, 8).map((neighbor) => (
                <Link
                  key={neighbor.id}
                  href={`/station/${encodeURIComponent(neighbor.id)}`}
                  className='rounded-full border border-theme-border bg-theme-card px-3 py-1 text-xs text-theme-text hover:border-theme-primary hover:text-theme-primary'
                >
                  {neighbor.title}
                </Link>
              ))}
            </div>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Link
              href={`/station/${encodeURIComponent(station.id)}`}
              className='rounded-full bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-bg shadow-theme-soft hover:bg-theme-secondary hover:text-theme-text'
            >
              Open station page
            </Link>
            <a
              href={station.wikipedia_url}
              target='_blank'
              rel='noreferrer'
              className='rounded-full border border-theme-border bg-theme-card px-4 py-2 text-sm text-theme-text hover:border-theme-primary hover:text-theme-primary'
            >
              Open on Wikipedia
            </a>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
