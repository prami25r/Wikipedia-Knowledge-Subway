import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-[920px] flex-col items-start justify-center gap-6 px-4 py-10 md:px-8'>
      <p className='text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300'>Not Found</p>
      <h1 className='text-4xl font-semibold tracking-tight text-white'>That station or line is not in the current subway map.</h1>
      <p className='max-w-2xl text-base text-slate-400'>
        The current dataset is curated, so not every Wikipedia article exists as a station yet. Head back to the explorer and search within the
        available network.
      </p>
      <Link
        href='/'
        className='rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300'
      >
        Return to explorer
      </Link>
    </main>
  );
}
