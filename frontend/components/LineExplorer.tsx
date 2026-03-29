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
    <section className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-glow'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-theme-primary'>Lines</p>
          <h2 className='text-xl font-semibold text-theme-text md:text-2xl'>Switch between knowledge lines and inspect the network like a transit map.</h2>
          <p className='text-sm text-theme-muted md:text-base'>
            Each line clusters a domain of knowledge. Filter the explorer, inspect transfer-heavy areas, and jump into dedicated line pages.
          </p>
        </div>
        <button
          type='button'
          onClick={() => subwayActions.setActiveLine(null)}
          className={`rounded-full border px-3 py-2 text-sm ${
            activeLineId === null
              ? 'border-theme-primary bg-theme-primary-soft text-theme-primary shadow-theme-soft'
              : 'border-theme-border bg-theme-card text-theme-muted hover:border-theme-primary hover:text-theme-text'
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
              className={`rounded-2xl border p-4 ${
                isActive
                  ? 'border-theme-primary bg-theme-primary-soft shadow-theme-glow'
                  : 'border-theme-border bg-theme-subcard shadow-theme-soft hover:border-theme-border-strong'
              }`}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-1'>
                  <h3 className='text-base font-semibold text-theme-text'>{line.name}</h3>
                  <p className='text-xs uppercase tracking-[0.24em] text-theme-soft'>{line.id}</p>
                </div>
                <button
                  type='button'
                  onClick={() => subwayActions.setActiveLine(isActive ? null : line.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    isActive
                      ? 'border-theme-primary bg-theme-card text-theme-primary'
                      : 'border-theme-border bg-theme-card text-theme-muted hover:border-theme-primary hover:text-theme-text'
                  }`}
                >
                  {isActive ? 'Filtering' : 'Filter graph'}
                </button>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
                <div className='rounded-xl border border-theme-border bg-theme-card p-3'>
                  <p className='text-theme-soft'>Stations</p>
                  <p className='mt-1 text-lg font-semibold text-theme-text'>{line.station_count}</p>
                </div>
                <div className='rounded-xl border border-theme-border bg-theme-card p-3'>
                  <p className='text-theme-soft'>Transfers</p>
                  <p className='mt-1 text-lg font-semibold text-theme-text'>{line.transfer_station_count}</p>
                </div>
                <div className='rounded-xl border border-theme-border bg-theme-card p-3'>
                  <p className='text-theme-soft'>Internal links</p>
                  <p className='mt-1 text-lg font-semibold text-theme-text'>{line.internal_edge_count}</p>
                </div>
                <div className='rounded-xl border border-theme-border bg-theme-card p-3'>
                  <p className='text-theme-soft'>Avg degree</p>
                  <p className='mt-1 text-lg font-semibold text-theme-text'>{line.average_degree}</p>
                </div>
              </div>

              <p className='mt-4 text-xs text-theme-muted'>
                Connected lines:{' '}
                {line.connected_lines.length > 0 ? line.connected_lines.slice(0, 3).map((item) => item.name).join(', ') : 'Isolated inside current dataset'}
              </p>

              <div className='mt-4 flex flex-wrap gap-2'>
                {line.sample_stations.slice(0, 4).map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${encodeURIComponent(station.id)}`}
                    className='rounded-full border border-theme-border bg-theme-card px-3 py-1.5 text-xs text-theme-text hover:border-theme-primary hover:text-theme-primary'
                  >
                    {station.title}
                  </Link>
                ))}
              </div>

              <div className='mt-5'>
                <Link href={`/line/${encodeURIComponent(line.id)}`} className='inline-flex items-center text-sm font-medium text-theme-primary hover:text-theme-secondary'>
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
