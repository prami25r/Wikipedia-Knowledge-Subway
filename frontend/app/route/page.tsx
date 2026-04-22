import { RouteViewer } from '@/components/RouteViewer';

const routePlanningTips = [
  'Start from high-degree hubs if you want shorter journeys across the graph.',
  'Cross-line trips are usually the most interesting because they expose transfer stations between disciplines.',
  'Use exact article titles when possible, but ids also work if you already know the normalized station name.',
];

export default function RoutePage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-5 px-4 py-5 md:px-8 md:py-8'>
      <section className='metro-hero-bg rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Route Planning</p>
        <h1 className='mt-3 max-w-3xl text-3xl font-semibold leading-tight text-theme-text md:text-4xl'>Turn article-to-article navigation into a subway trip.</h1>
        <p className='mt-4 max-w-2xl text-sm leading-6 text-theme-muted'>
          The planner uses the live graph to compute the shortest available path through the current knowledge network.
        </p>
      </section>

      <RouteViewer />

      <section className='rounded-lg border border-theme-border bg-theme-card p-4 shadow-theme-soft md:p-5'>
        <h2 className='text-lg font-semibold text-theme-text'>Route Planning Tips</h2>
        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          {routePlanningTips.map((tip) => (
            <article key={tip} className='rounded-lg border border-theme-border bg-theme-subcard p-4 text-sm text-theme-muted'>
              {tip}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
