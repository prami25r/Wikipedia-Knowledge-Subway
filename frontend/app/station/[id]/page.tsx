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
      <main className='mx-auto flex min-h-screen w-full max-w-[1240px] flex-col gap-5 px-4 py-5 md:px-8 md:py-8'>
        <div className='space-y-4'>
          <Link href='/' className='text-sm font-medium text-theme-primary hover:text-theme-secondary'>
            &lt;- Back to Map
          </Link>
          <div className='metro-hero-bg rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>{humanizeCluster(station.cluster)} Line</p>
                <h1 className='text-3xl font-semibold leading-tight text-theme-text md:text-4xl'>{station.title}</h1>
                <p className='max-w-3xl text-sm leading-6 text-theme-muted md:text-base'>
                  {station.summary || 'This station is part of the current subway graph, but richer article metadata has not been filled in yet.'}
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Link
                  href={`/line/${encodeURIComponent(station.cluster)}`}
                  className='rounded-md bg-theme-primary px-4 py-2.5 text-sm font-semibold text-white shadow-theme-soft hover:bg-theme-secondary'
                >
                  Open line
                </Link>
                <a
                  href={station.wikipedia_url}
                  target='_blank'
                  rel='noreferrer'
                  className='rounded-md border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-text hover:border-theme-primary hover:text-theme-primary'
                >
                  View on Wikipedia
                </a>
              </div>
            </div>
          </div>
        </div>

        <section className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          <div className='space-y-4'>
            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Station Info</h2>
              <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-lg border border-theme-border bg-theme-subcard p-4'>
                  <p className='text-sm text-theme-soft'>Degree</p>
                  <p className='mt-2 text-3xl font-semibold text-theme-text'>{station.degree}</p>
                </div>
                <div className='rounded-lg border border-theme-border bg-theme-subcard p-4'>
                  <p className='text-sm text-theme-soft'>Neighbors</p>
                  <p className='mt-2 text-3xl font-semibold text-theme-text'>{station.neighbors.length}</p>
                </div>
                <div className='rounded-lg border border-theme-border bg-theme-subcard p-4'>
                  <p className='text-sm text-theme-soft'>Transfer mode</p>
                  <p className='mt-2 text-lg font-semibold text-theme-text'>{station.is_transfer_station ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </article>

            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Connected Stations</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                {station.neighbors.slice(0, 16).map((neighbor) => (
                  <Link
                    key={neighbor.id}
                    href={`/station/${encodeURIComponent(neighbor.id)}`}
                    className='rounded-lg border border-theme-border bg-theme-subcard p-4 shadow-theme-soft hover:border-theme-primary'
                  >
                    <p className='text-base font-semibold text-theme-text'>{neighbor.title}</p>
                    <p className='mt-2 text-sm text-theme-muted'>{humanizeCluster(neighbor.cluster)} Line</p>
                    <p className='mt-3 text-sm text-theme-text'>{neighbor.degree} links</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className='space-y-4'>
            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Neighbor Lines</h2>
              <div className='mt-4 flex flex-wrap gap-2'>
                {station.neighbor_clusters.map((entry) => (
                  <Link
                    key={entry.cluster}
                    href={`/line/${encodeURIComponent(entry.cluster)}`}
                    className='rounded-md border border-theme-border bg-theme-subcard px-3 py-1.5 text-sm text-theme-text hover:border-theme-primary hover:text-theme-primary'
                  >
                    {humanizeCluster(entry.cluster)} - {entry.count}
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Categories</h2>
              <div className='mt-4 flex flex-wrap gap-2'>
                {station.categories.length > 0 ? (
                  station.categories.map((category) => (
                    <span key={category} className='rounded-md border border-theme-border bg-theme-subcard px-3 py-1.5 text-sm text-theme-text'>
                      {category}
                    </span>
                  ))
                ) : (
                  <p className='text-sm text-theme-muted'>No categories captured for this station yet.</p>
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
