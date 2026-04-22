import Link from 'next/link';
import { notFound } from 'next/navigation';
import { humanizeCluster } from '@/lib/cluster';
import { serverBackendApi } from '@/lib/server-backend-api';

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('(404)');
}

export default async function LinePage({ params }: { params: Promise<{ cluster: string }> }) {
  const { cluster } = await params;

  try {
    const line = await serverBackendApi.getLine(cluster);

    return (
      <main className='mx-auto flex min-h-screen w-full max-w-[1320px] flex-col gap-5 px-4 py-5 md:px-8 md:py-8'>
        <div className='space-y-4'>
          <Link href='/' className='text-sm font-medium text-theme-primary hover:text-theme-secondary'>
            &lt;- Back to Map
          </Link>
          <section className='metro-hero-bg rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Line Overview</p>
                <h1 className='text-3xl font-semibold leading-tight text-theme-text md:text-4xl'>{line.name}</h1>
                <p className='max-w-3xl text-sm leading-6 text-theme-muted md:text-base'>
                  {humanizeCluster(line.id)} is one of the main knowledge corridors in the subway. Use this page to inspect hubs, connected lines,
                  and the stations that define the line today.
                </p>
              </div>
              <Link
                href='/route'
                className='rounded-md border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-text hover:border-theme-primary hover:text-theme-primary'
              >
                Plan a route
              </Link>
            </div>
          </section>
        </div>

        <section className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <div className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
            <p className='text-sm text-theme-soft'>Stations</p>
            <p className='mt-2 text-3xl font-semibold text-theme-text'>{line.station_count}</p>
          </div>
          <div className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
            <p className='text-sm text-theme-soft'>Internal links</p>
            <p className='mt-2 text-3xl font-semibold text-theme-text'>{line.internal_edge_count}</p>
          </div>
          <div className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
            <p className='text-sm text-theme-soft'>Transfers</p>
            <p className='mt-2 text-3xl font-semibold text-theme-text'>{line.transfer_station_count}</p>
          </div>
          <div className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
            <p className='text-sm text-theme-soft'>Average degree</p>
            <p className='mt-2 text-3xl font-semibold text-theme-text'>{line.average_degree}</p>
          </div>
        </section>

        <section className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          <div className='space-y-4'>
            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Top Hubs on this Line</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                {line.top_hubs.map((hub) => (
                  <Link
                    key={hub.id}
                    href={`/station/${encodeURIComponent(hub.id)}`}
                    className='rounded-lg border border-theme-border bg-theme-subcard p-4 shadow-theme-soft hover:border-theme-primary'
                  >
                    <p className='text-base font-semibold text-theme-text'>{hub.title}</p>
                    <p className='mt-2 text-sm text-theme-muted'>{hub.degree} links</p>
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Stations</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                {line.stations.map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${encodeURIComponent(station.id)}`}
                    className='rounded-lg border border-theme-border bg-theme-subcard p-4 shadow-theme-soft hover:border-theme-primary'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <p className='text-base font-semibold text-theme-text'>{station.title}</p>
                      {station.is_transfer_station ? (
                        <span className='rounded-md border border-theme-transfer bg-theme-transfer-soft px-2 py-1 text-[10px] font-semibold text-theme-transfer'>
                          Transfer
                        </span>
                      ) : null}
                    </div>
                    <p className='mt-3 text-sm text-theme-muted'>{station.degree} links</p>
                    <p className='mt-1 text-sm text-theme-muted'>{station.neighbor_count} neighbors</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className='space-y-4'>
            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Connected Lines</h2>
              <div className='mt-4 space-y-3'>
                {line.connected_lines.map((connectedLine) => (
                  <Link
                    key={connectedLine.cluster}
                    href={`/line/${encodeURIComponent(connectedLine.cluster)}`}
                    className='flex items-center justify-between rounded-lg border border-theme-border bg-theme-subcard px-4 py-3 shadow-theme-soft hover:border-theme-primary'
                  >
                    <span className='text-theme-text'>{connectedLine.name}</span>
                    <span className='text-sm text-theme-muted'>{connectedLine.count} cross-line links</span>
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-lg border border-theme-border bg-theme-card p-5 shadow-theme-soft'>
              <h2 className='text-lg font-semibold text-theme-text'>Transfer Stations</h2>
              <div className='mt-4 space-y-3'>
                {line.transfer_stations.length > 0 ? (
                  line.transfer_stations.map((station) => (
                    <Link
                      key={station.id}
                      href={`/station/${encodeURIComponent(station.id)}`}
                      className='block rounded-lg border border-theme-border bg-theme-subcard px-4 py-3 shadow-theme-soft hover:border-theme-primary'
                    >
                      <p className='text-theme-text'>{station.title}</p>
                      <p className='mt-1 text-sm text-theme-muted'>{station.connected_clusters.map(humanizeCluster).join(', ')}</p>
                    </Link>
                  ))
                ) : (
                  <p className='text-sm text-theme-muted'>No transfer stations were identified for this line in the current dataset.</p>
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
