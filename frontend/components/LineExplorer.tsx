'use client';

import Link from 'next/link';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';

export function LineExplorer() {
  const lines = useSubwayStore((state) => state.lines);
  const activeLineId = useSubwayStore((state) => state.activeLineId);

  if (lines.length === 0) {
    return null;
  }

  return (
    <section className='rounded-[28px] border border-slate-800 bg-slate-900/75 p-5 shadow-[0_20px_80px_-45px_rgba(34,211,238,0.45)]'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300'>Lines</p>
          <h2 className='text-xl font-semibold text-slate-50 md:text-2xl'>Switch between knowledge lines and inspect the network like a transit map.</h2>
          <p className='text-sm text-slate-400 md:text-base'>
            Each line clusters a domain of knowledge. Filter the explorer, inspect transfer-heavy areas, and jump into dedicated line pages.
          </p>
        </div>
        <button
          type='button'
          onClick={() => subwayActions.setActiveLine(null)}
          className={`rounded-full border px-3 py-2 text-sm transition ${
            activeLineId === null ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500/60'
          }`}
        >
          Show all lines
        </button>
      </div>

      <div className='mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {lines.map((line) => {
          const isActive = activeLineId === line.id;

          return (
            <article
              key={line.id}
              className={`rounded-2xl border p-4 transition ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_18px_40px_-30px_rgba(34,211,238,0.9)]'
                  : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
              }`}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <h3 className='text-base font-semibold text-slate-100'>{line.name}</h3>
                  <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>{line.id}</p>
                </div>
                <button
                  type='button'
                  onClick={() => subwayActions.setActiveLine(isActive ? null : line.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-slate-700 text-slate-300 hover:border-cyan-500/60'
                  }`}
                >
                  {isActive ? 'Filtering' : 'Filter graph'}
                </button>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
                <div className='rounded-xl border border-slate-800 bg-slate-900/70 p-3'>
                  <p className='text-slate-500'>Stations</p>
                  <p className='mt-1 text-lg font-semibold text-slate-50'>{line.station_count}</p>
                </div>
                <div className='rounded-xl border border-slate-800 bg-slate-900/70 p-3'>
                  <p className='text-slate-500'>Transfers</p>
                  <p className='mt-1 text-lg font-semibold text-slate-50'>{line.transfer_station_count}</p>
                </div>
                <div className='rounded-xl border border-slate-800 bg-slate-900/70 p-3'>
                  <p className='text-slate-500'>Internal links</p>
                  <p className='mt-1 text-lg font-semibold text-slate-50'>{line.internal_edge_count}</p>
                </div>
                <div className='rounded-xl border border-slate-800 bg-slate-900/70 p-3'>
                  <p className='text-slate-500'>Avg degree</p>
                  <p className='mt-1 text-lg font-semibold text-slate-50'>{line.average_degree}</p>
                </div>
              </div>

              <p className='mt-4 text-xs text-slate-400'>
                Connected lines:{' '}
                {line.connected_lines.length > 0 ? line.connected_lines.slice(0, 3).map((item) => item.name).join(', ') : 'Isolated inside current dataset'}
              </p>

              <div className='mt-4 flex flex-wrap gap-2'>
                {line.sample_stations.slice(0, 4).map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${encodeURIComponent(station.id)}`}
                    className='rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200'
                  >
                    {station.title}
                  </Link>
                ))}
              </div>

              <div className='mt-5'>
                <Link
                  href={`/line/${encodeURIComponent(line.id)}`}
                  className='inline-flex items-center text-sm font-medium text-cyan-300 transition hover:text-cyan-200'
                >
                  Open line overview
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
