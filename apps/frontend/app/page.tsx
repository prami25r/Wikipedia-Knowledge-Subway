import { GraphPanel } from '@/components/GraphPanel';

export default function HomePage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 p-4 md:p-8'>
      <header className='space-y-2'>
        <p className='inline-flex rounded-full border border-cyan-800 bg-cyan-950/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-300'>
          Wikipedia Knowledge Subway
        </p>
        <h1 className='text-2xl font-bold text-slate-100 md:text-4xl'>Interactive Subway-Style Wikipedia Explorer</h1>
        <p className='max-w-3xl text-sm text-slate-400 md:text-base'>
          Explore Wikipedia topics as stations, clusters as subway lines, and hyperlinks as routes. Search, inspect station metadata,
          and animate shortest paths in real-time.
        </p>
      </header>
      <GraphPanel />
    </main>
  );
}
