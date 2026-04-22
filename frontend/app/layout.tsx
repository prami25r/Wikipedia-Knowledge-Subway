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
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/about#how-it-works', label: 'How it Works' },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='en' className='theme-dark' suppressHydrationWarning>
      <body>
        <Script id='theme-init' strategy='beforeInteractive'>
          {getThemeInitScript()}
        </Script>
        <ThemeProvider>
          <div className='min-h-screen bg-theme-app'>
            <header className='sticky top-0 z-30 border-b border-theme-border bg-theme-header backdrop-blur-xl'>
              <div className='mx-auto flex h-auto w-full max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:h-16 md:px-8'>
                <Link href='/' className='flex items-center gap-3 text-theme-text'>
                  <span className='inline-flex h-9 w-9 items-center justify-center rounded-md bg-theme-primary text-base font-semibold text-white shadow-theme-soft'>
                    W
                  </span>
                  <p className='text-sm font-semibold text-theme-primary md:text-base'>Wikipedia Knowledge Subway</p>
                </Link>

                <div className='flex flex-wrap items-center justify-end gap-2 md:gap-4'>
                  <nav className='flex flex-wrap items-center gap-1 md:gap-2'>
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className='rounded-md px-3 py-2 text-xs font-medium text-theme-muted hover:bg-theme-primary-soft hover:text-theme-primary md:text-sm'
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <div className='pb-10'>{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
