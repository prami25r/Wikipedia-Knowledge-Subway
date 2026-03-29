import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-[920px] flex-col items-start justify-center gap-6 px-4 py-10 md:px-8'>
      <p className='text-xs font-semibold uppercase tracking-[0.32em] text-theme-primary'>Not Found</p>
      <h1 className='text-4xl font-semibold tracking-tight text-theme-text'>That station or line is not in the current subway map.</h1>
      <p className='max-w-2xl text-base text-theme-muted'>
        The current dataset is curated, so not every Wikipedia article exists as a station yet. Head back to the explorer and search within the
        available network.
      </p>
      <Link
        href='/'
        className='rounded-full bg-theme-primary px-4 py-2.5 text-sm font-semibold text-theme-bg shadow-theme-soft hover:bg-theme-secondary hover:text-theme-text'
      >
        Return to explorer
      </Link>
    </main>
  );
}
