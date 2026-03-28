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
      <main className='mx-auto flex min-h-screen w-full max-w-[1320px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10'>
        <div className='space-y-4'>
          <Link href='/' className='text-sm font-medium text-cyan-300 transition hover:text-cyan-200'>
            Back to explorer
          </Link>
          <section className='rounded-[32px] border border-slate-800 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,47,73,0.88),rgba(34,197,94,0.08))] p-6 md:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200'>Line Overview</p>
                <h1 className='text-3xl font-semibold tracking-tight text-white md:text-5xl'>{line.name}</h1>
                <p className='max-w-3xl text-sm leading-6 text-slate-300 md:text-base'>
                  {humanizeCluster(line.id)} is one of the main knowledge corridors in the subway. Use this page to inspect hubs, connected lines,
                  and the stations that define the line today.
                </p>
              </div>
              <Link
                href='/route'
                className='rounded-full border border-slate-700 px-4 py-2.5 text-sm text-slate-100 transition hover:border-cyan-500/70 hover:text-cyan-200'
              >
                Plan a route
              </Link>
            </div>
          </section>
        </div>

        <section className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          <div className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
            <p className='text-sm text-slate-500'>Stations</p>
            <p className='mt-2 text-3xl font-semibold text-slate-50'>{line.station_count}</p>
          </div>
          <div className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
            <p className='text-sm text-slate-500'>Internal links</p>
            <p className='mt-2 text-3xl font-semibold text-slate-50'>{line.internal_edge_count}</p>
          </div>
          <div className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
            <p className='text-sm text-slate-500'>Transfers</p>
            <p className='mt-2 text-3xl font-semibold text-slate-50'>{line.transfer_station_count}</p>
          </div>
          <div className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
            <p className='text-sm text-slate-500'>Average degree</p>
            <p className='mt-2 text-3xl font-semibold text-slate-50'>{line.average_degree}</p>
          </div>
        </section>

        <section className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          <div className='space-y-4'>
            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Top hubs on this line</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                {line.top_hubs.map((hub) => (
                  <Link
                    key={hub.id}
                    href={`/station/${encodeURIComponent(hub.id)}`}
                    className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500/70'
                  >
                    <p className='text-base font-semibold text-slate-100'>{hub.title}</p>
                    <p className='mt-2 text-sm text-slate-400'>{hub.degree} links</p>
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Stations</h2>
              <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                {line.stations.map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${encodeURIComponent(station.id)}`}
                    className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-cyan-500/70'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <p className='text-base font-semibold text-slate-100'>{station.title}</p>
                      {station.is_transfer_station ? (
                        <span className='rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200'>
                          Transfer
                        </span>
                      ) : null}
                    </div>
                    <p className='mt-3 text-sm text-slate-400'>{station.degree} links</p>
                    <p className='mt-1 text-sm text-slate-400'>{station.neighbor_count} neighbors</p>
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className='space-y-4'>
            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Connected lines</h2>
              <div className='mt-4 space-y-3'>
                {line.connected_lines.map((connectedLine) => (
                  <Link
                    key={connectedLine.cluster}
                    href={`/line/${encodeURIComponent(connectedLine.cluster)}`}
                    className='flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 transition hover:border-cyan-500/70'
                  >
                    <span className='text-slate-100'>{connectedLine.name}</span>
                    <span className='text-sm text-slate-400'>{connectedLine.count} cross-line links</span>
                  </Link>
                ))}
              </div>
            </article>

            <article className='rounded-[24px] border border-slate-800 bg-slate-900/75 p-5'>
              <h2 className='text-lg font-semibold text-slate-50'>Transfer stations</h2>
              <div className='mt-4 space-y-3'>
                {line.transfer_stations.length > 0 ? (
                  line.transfer_stations.map((station) => (
                    <Link
                      key={station.id}
                      href={`/station/${encodeURIComponent(station.id)}`}
                      className='block rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 transition hover:border-cyan-500/70'
                    >
                      <p className='text-slate-100'>{station.title}</p>
                      <p className='mt-1 text-sm text-slate-400'>{station.connected_clusters.map(humanizeCluster).join(', ')}</p>
                    </Link>
                  ))
                ) : (
                  <p className='text-sm text-slate-400'>No transfer stations were identified for this line in the current dataset.</p>
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
