import { RouteViewer } from '@/components/RouteViewer';

const routePlanningTips = [
  'Start from high-degree hubs if you want shorter journeys across the graph.',
  'Cross-line trips are usually the most interesting because they expose transfer stations between disciplines.',
  'Use exact article titles when possible, but ids also work if you already know the normalized station name.',
];

export default function RoutePage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10'>
      <section className='rounded-[32px] border border-theme-border-strong bg-theme-hero p-6 shadow-theme-glow md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.32em] text-theme-highlight'>Route Planning</p>
        <h1 className='mt-4 text-3xl font-semibold tracking-tight text-theme-text md:text-5xl'>Turn article-to-article navigation into a concrete subway trip.</h1>
        <p className='mt-4 max-w-3xl text-sm leading-6 text-theme-muted md:text-base'>
          This planner uses the live graph to compute the shortest available path through the current subway network. It is the clearest place
          to see the project as a navigation engine rather than a visualization demo.
        </p>
      </section>

      <RouteViewer />

      <section className='rounded-[28px] border border-theme-border bg-theme-panel p-5 shadow-theme-soft'>
        <h2 className='text-xl font-semibold text-theme-text'>Route planning tips</h2>
        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          {routePlanningTips.map((tip) => (
            <article key={tip} className='rounded-2xl border border-theme-border bg-theme-subcard p-4 text-sm text-theme-muted'>
              {tip}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
