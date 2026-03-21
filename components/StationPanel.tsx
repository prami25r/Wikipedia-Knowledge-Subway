'use client';

import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
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
    return <aside className='rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-400'>Select a station.</aside>;
  }

  return (
    <aside className='rounded-xl border border-slate-700 bg-slate-900/80 p-4'>
      <h3 className='mb-3 text-lg font-semibold text-cyan-300'>Station Details</h3>
      {loading ? <p className='text-sm text-slate-400'>Loading...</p> : null}
      {error ? <p className='text-sm text-red-300'>{error}</p> : null}
      {station ? (
        <div className='space-y-3 text-sm'>
          <p className='text-slate-100'>
            <span className='text-slate-400'>Title:</span> {station.title}
          </p>
          <p className='text-slate-100'>
            <span className='text-slate-400'>Cluster:</span> {station.cluster}
          </p>
          <p className='text-slate-300'>{station.summary || 'No summary available.'}</p>
          <p className='text-slate-100'>
            <span className='text-slate-400'>Categories:</span> {station.categories.slice(0, 5).join(', ') || '—'}
          </p>
          <p className='text-slate-100'>
            <span className='text-slate-400'>Neighbors:</span> {station.neighbors.length}
          </p>
          <a href={station.wikipedia_url} target='_blank' rel='noreferrer' className='inline-block text-cyan-300 hover:underline'>
            Open on Wikipedia
          </a>
        </div>
      ) : null}
    </aside>
  );
}
