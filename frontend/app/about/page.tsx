const steps = [
  {
    title: '1. Search',
    copy: 'Enter any Wikipedia topic to start your journey.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-8 w-8' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.8'>
        <circle cx='11' cy='11' r='7' />
        <path d='m20 20-3.5-3.5' />
      </svg>
    ),
  },
  {
    title: '2. Explore',
    copy: 'View related topics as nearby stations on the map.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-8 w-8' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.8'>
        <path d='M6 7a2 2 0 1 0 0 .01' />
        <path d='M18 7a2 2 0 1 0 0 .01' />
        <path d='M12 17a2 2 0 1 0 0 .01' />
        <path d='M8 8.5 11 15' />
        <path d='m16 8.5-3 6.5' />
      </svg>
    ),
  },
  {
    title: '3. Connect',
    copy: 'Article links appear as colored line segments.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-8 w-8' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.8'>
        <path d='M12 4v5' />
        <path d='M12 15v5' />
        <path d='M9 7h6' />
        <path d='M9 17h6' />
        <path d='M12 9a3 3 0 0 0 0 6' />
      </svg>
    ),
  },
  {
    title: '4. Discover',
    copy: 'Find shortest paths and uncover transfer stations.',
    icon: (
      <svg viewBox='0 0 24 24' className='h-8 w-8' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.8'>
        <path d='M5 4v16' />
        <path d='M5 5h12l-2 4 2 4H5' />
      </svg>
    ),
  },
];

const stack = ['Next.js', 'React', 'TypeScript', 'Wikipedia API', 'Graphology', 'Sigma'];

export default function AboutPage() {
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-[1320px] flex-col gap-5 px-4 py-5 md:px-8 md:py-8'>
      <section className='rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>About</p>
            <h1 className='mt-3 text-3xl font-semibold leading-tight text-theme-text md:text-4xl'>Wikipedia Knowledge Subway</h1>
            <p className='mt-4 max-w-3xl text-sm leading-6 text-theme-muted md:text-base'>
              A visualization tool that represents Wikipedia topics as subway stations and hyperlinks as connections. It helps you explore
              knowledge through interactive maps, line filters, station details, and shortest paths.
            </p>
          </div>
          <div className='metro-map-grid rounded-lg border border-theme-border bg-theme-subcard p-5'>
            <div className='relative h-44'>
              <div className='absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-theme-primary' />
              <div className='absolute bottom-8 left-1/2 top-8 w-1 -translate-x-1/2 rounded-full bg-theme-secondary' />
              <div className='absolute left-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border-4 border-theme-primary bg-theme-card' />
              <div className='absolute left-1/2 top-8 h-12 w-12 -translate-x-1/2 rounded-full border-4 border-theme-secondary bg-theme-card' />
              <div className='absolute right-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border-4 border-theme-highlight bg-theme-card' />
              <div className='absolute bottom-8 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full border-4 border-theme-transfer bg-theme-card' />
            </div>
          </div>
        </div>
      </section>

      <section id='how-it-works' className='rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>How It Works</p>
        <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {steps.map((step) => (
            <article key={step.title} className='rounded-lg border border-theme-border bg-theme-subcard p-5 text-center shadow-theme-soft'>
              <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-theme-primary-soft text-theme-primary'>{step.icon}</div>
              <h2 className='mt-4 text-sm font-semibold text-theme-text'>{step.title}</h2>
              <p className='mt-2 text-sm leading-5 text-theme-muted'>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className='rounded-lg border border-theme-border bg-theme-card p-6 shadow-theme-soft md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-theme-muted'>Tech Stack</p>
        <div className='mt-4 flex flex-wrap gap-2'>
          {stack.map((item) => (
            <span key={item} className='rounded-md border border-theme-border bg-theme-subcard px-3 py-1.5 text-sm text-theme-primary'>
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
