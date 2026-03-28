import { RouteViewer } from '@/components/RouteViewer';

const routePlanningTips = [
  'Start from high-degree hubs if you want shorter journeys across the graph.',
  'Cross-line trips are usually the most interesting because they expose transfer stations between disciplines.',
  'Use exact article titles when possible, but ids also work if you already know the normalized station name.',
];

export default function RoutePage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-6 md:px-8 md:py-10'>
      <section className='rounded-[32px] border border-slate-800 bg-[linear-gradient(150deg,rgba(15,23,42,0.96),rgba(120,53,15,0.22),rgba(14,116,144,0.18))] p-6 md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.32em] text-amber-200'>Route Planning</p>
        <h1 className='mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl'>Turn article-to-article navigation into a concrete subway trip.</h1>
        <p className='mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base'>
          This planner uses the live graph to compute the shortest available path through the current subway network. It is the clearest
          place to see the project as a navigation engine rather than a visualization demo.
        </p>
      </section>

      <RouteViewer />

      <section className='rounded-[28px] border border-slate-800 bg-slate-900/75 p-5'>
        <h2 className='text-xl font-semibold text-slate-50'>Route planning tips</h2>
        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          {routePlanningTips.map((tip) => (
            <article key={tip} className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300'>
              {tip}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
