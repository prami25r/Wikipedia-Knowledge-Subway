'use client';

import { useMemo, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';

export function RouteViewer() {
  const graph = useSubwayStore((state) => state.graph);
  const routePath = useSubwayStore((state) => state.routePath);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const options = useMemo(() => graph?.nodes.map((node) => node.id) ?? [], [graph]);

  async function findRoute() {
    if (!start || !end) {
      setError('Choose both start and end stations.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await backendApi.getRoute(start, end);
      subwayActions.setRouteEndpoints(start, end);
      subwayActions.setRoutePath(response.path);
      if (response.path.length > 0) subwayActions.selectNode(response.path[response.path.length - 1]);
    } catch (err) {
      subwayActions.setRoutePath([]);
      setError(err instanceof Error ? err.message : 'Unable to compute route.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className='rounded-xl border border-slate-700 bg-slate-900/80 p-4'>
      <h3 className='mb-3 text-sm font-semibold text-cyan-300'>Route Viewer</h3>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
        <input list='station-options' value={start} onChange={(e) => setStart(e.target.value)} placeholder='Start station id' className='rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm' />
        <input list='station-options' value={end} onChange={(e) => setEnd(e.target.value)} placeholder='End station id' className='rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm' />
      </div>
      <datalist id='station-options'>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <button type='button' onClick={() => void findRoute()} className='mt-3 rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500'>
        {loading ? 'Finding...' : 'Find shortest path'}
      </button>
      {error ? <p className='mt-2 text-sm text-red-300'>{error}</p> : null}
      {routePath.length > 0 ? <p className='mt-2 text-xs text-slate-300'>Path: {routePath.join(' → ')}</p> : null}
    </section>
  );
}
