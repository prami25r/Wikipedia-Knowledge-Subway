import Link from 'next/link';
import { notFound } from 'next/navigation';
import { humanizeCluster } from '@/lib/cluster';
import { serverBackendApi } from '@/lib/server-backend-api';

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('(404)');
}

export default async function StationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const station = await serverBackendApi.getStation(id);

    return (
      <main className='mx-auto flex min-h-screen w-full max-w-[1240px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10'>
        <div className='space-y-4'>
          <Link href='/' className='text-sm font-medium text-cyan-300 transition hover:text-cyan-200'>
            Back to explorer
          </Link>
          <div className='rounded-[30px] border border-slate-800 bg-[linear-gradient(140deg,rgba(8,47,73,0.78),rgba(15,23,42,0.96),rgba(14,165,233,0.08))] p-6 md:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200'>{humanizeCluster(station.cluster)} Line</p>
                <h1 className='text-3xl font-semibold tracking-tight text-white md:text-5xl'>{station.title}</h1>
                <p className='max-w-3xl text-sm leading-6 text-slate-300 md:text-base'>
                  {station.summary || 'This station is part of the current subway graph, but richer article metadata has not been filled in yet.'}
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Link
                  href={`/line/${encodeURIComponent(station.cluster)}`}
                  className='rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300'
                >
                  Open line
                </Link>
                <a
                  href={station.wikipedia_url}
                  target='_blank'
                  rel='noreferrer'
                  className='rounded-full border border-slate-700 px-4 py-2.5 text-sm text-slate-100 transition hover:border-cyan-500/70 hover:text-cyan-200'
                >
                  View on Wikipedia
                </a>
              </div>
            </div>
          </div>
        </div>

        <section className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          <div className='space-y-4'>
            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Station context</h2>
              <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4'>
                  <p className='text-sm text-slate-500'>Degree</p>
                  <p className='mt-2 text-3xl font-semibold text-slate-50'>{station.degree}</p>
                </div>
                <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4'>
                  <p className='text-sm text-slate-500'>Neighbors</p>
                  <p className='mt-2 text-3xl font-semibold text-slate-50'>{station.neighbors.length}</p>
                </div>
                <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4'>
                  <p className='text-sm text-slate-500'>Transfer mode</p>
                  <p className='mt-2 text-lg font-semibold text-slate-50'>{station.is_transfer_station ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </article>

            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Connected stations</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                {station.neighbors.slice(0, 16).map((neighbor) => (
                  <Link
                    key={neighbor.id}
                    href={`/station/${encodeURIComponent(neighbor.id)}`}
                    className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500/70'
                  >
                    <p className='text-base font-semibold text-slate-100'>{neighbor.title}</p>
                    <p className='mt-2 text-sm text-slate-400'>{humanizeCluster(neighbor.cluster)} Line</p>
                    <p className='mt-3 text-sm text-slate-300'>{neighbor.degree} links</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className='space-y-4'>
            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Neighbor lines</h2>
              <div className='mt-4 flex flex-wrap gap-2'>
                {station.neighbor_clusters.map((entry) => (
                  <Link
                    key={entry.cluster}
                    href={`/line/${encodeURIComponent(entry.cluster)}`}
                    className='rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200'
                  >
                    {humanizeCluster(entry.cluster)} · {entry.count}
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Categories</h2>
              <div className='mt-4 flex flex-wrap gap-2'>
                {station.categories.length > 0 ? (
                  station.categories.map((category) => (
                    <span key={category} className='rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200'>
                      {category}
                    </span>
                  ))
                ) : (
                  <p className='text-sm text-slate-400'>No categories captured for this station yet.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
