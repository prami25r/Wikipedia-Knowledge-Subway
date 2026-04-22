'use client';

import Link from 'next/link';
import { humanizeCluster } from '@/lib/cluster';
import { useSubwayStore } from '@/lib/frontend-store';

export function HubHighlights() {
  const stats = useSubwayStore((state) => state.stats);

  if (!stats || stats.top_hubs.length === 0) {
    return null;
  }

  return (
    <section className='rounded-lg border border-theme-border bg-theme-card p-4 shadow-theme-soft md:p-5'>
      <div className='flex flex-wrap items-end justify-between gap-3 border-b border-theme-border pb-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Hubs</p>
          <h2 className='mt-1 text-lg font-semibold text-theme-text'>Major Interchanges</h2>
        </div>
      </div>

      <div className='mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
        {stats.top_hubs.map((hub, index) => (
          <Link
            key={hub.id}
            href={`/station/${encodeURIComponent(hub.id)}`}
            className='group rounded-lg border border-theme-border bg-theme-subcard p-4 shadow-theme-soft hover:border-theme-primary hover:bg-theme-card'
          >
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-soft'>Hub {index + 1}</p>
            <h3 className='mt-3 text-base font-semibold text-theme-text group-hover:text-theme-primary'>{hub.title}</h3>
            <p className='mt-2 text-sm text-theme-muted'>{humanizeCluster(hub.cluster)} Line</p>
            <p className='mt-4 text-sm text-theme-text'>{hub.degree} direct links</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
