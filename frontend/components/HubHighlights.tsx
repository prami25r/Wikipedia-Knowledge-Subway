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
    <section className='rounded-[28px] border border-slate-800 bg-slate-900/75 p-5'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300'>Hubs</p>
          <h2 className='text-xl font-semibold text-slate-50 md:text-2xl'>High-degree stations that act like major interchanges.</h2>
        </div>
        <p className='max-w-xl text-sm text-slate-400'>These are the most connected ideas in the current network and the best places to start if you want fast lateral exploration.</p>
      </div>

      <div className='mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5'>
        {stats.top_hubs.map((hub, index) => (
          <Link
            key={hub.id}
            href={`/station/${encodeURIComponent(hub.id)}`}
            className='group rounded-2xl border border-slate-800 bg-slate-950/75 p-4 transition hover:border-cyan-500/70 hover:bg-slate-950'
          >
            <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Hub {index + 1}</p>
            <h3 className='mt-3 text-base font-semibold text-slate-100 group-hover:text-cyan-200'>{hub.title}</h3>
            <p className='mt-2 text-sm text-slate-400'>{humanizeCluster(hub.cluster)} Line</p>
            <p className='mt-4 text-sm text-slate-200'>{hub.degree} direct links</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
