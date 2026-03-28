import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wikipedia Knowledge Subway',
  description: 'Explore connected Wikipedia concepts as an interactive subway map.',
};

const navItems = [
  { href: '/', label: 'Explorer' },
  { href: '/route', label: 'Route Planner' },
  { href: '/line/technology', label: 'Lines' },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en'>
      <body>
        <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#020617_30%,#08111f_100%)]'>
          <header className='border-b border-slate-800/80 bg-slate-950/75 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60'>
            <div className='mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-4 md:px-8'>
              <Link href='/' className='flex items-center gap-3 text-slate-50'>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/50 bg-cyan-500/10 text-sm font-semibold text-cyan-200'>
                  WS
                </span>
                <div>
                  <p className='text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200'>Wikipedia Knowledge Subway</p>
                  <p className='text-xs text-slate-500'>Knowledge as transit infrastructure</p>
                </div>
              </Link>

              <nav className='flex flex-wrap items-center gap-2'>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/70 hover:text-cyan-200'
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
