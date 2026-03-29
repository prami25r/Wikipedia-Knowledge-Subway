import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider, ThemeToggle } from '@/components/ThemeProvider';
import { getThemeInitScript } from '@/lib/theme';
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
    <html lang='en' className='theme-metro' suppressHydrationWarning>
      <body>
        <Script id='theme-init' strategy='beforeInteractive'>
          {getThemeInitScript()}
        </Script>
        <ThemeProvider>
          <div className='min-h-screen bg-theme-app'>
            <header className='border-b border-theme-border bg-theme-header backdrop-blur'>
              <div className='mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8'>
                <Link href='/' className='flex items-center gap-3 text-theme-text'>
                  <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-theme-primary bg-theme-primary-soft text-sm font-semibold text-theme-primary shadow-theme-soft'>
                    WS
                  </span>
                  <div>
                    <p className='text-sm font-semibold uppercase tracking-[0.28em] text-theme-primary'>Wikipedia Knowledge Subway</p>
                    <p className='text-xs text-theme-soft'>Knowledge as transit infrastructure</p>
                  </div>
                </Link>

                <div className='flex flex-wrap items-center justify-end gap-2 md:gap-3'>
                  <nav className='flex flex-wrap items-center gap-2'>
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className='rounded-full border border-theme-border bg-theme-panel px-3 py-2 text-sm text-theme-muted hover:border-theme-primary hover:text-theme-text'
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
