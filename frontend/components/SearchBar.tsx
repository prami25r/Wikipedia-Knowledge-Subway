'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import type { BackendSearchItem } from '@/types/backend';

type SearchBarProps = {
  buttonLabel?: string;
  className?: string;
  onSelect?: (stationId: string) => void;
  placeholder?: string;
  showButton?: boolean;
  variant?: 'default' | 'hero' | 'compact';
};

function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchBar({
  buttonLabel = 'Search',
  className = '',
  onSelect,
  placeholder,
  showButton = false,
  variant = 'default',
}: SearchBarProps) {
  const activeLineId = useSubwayStore((state) => state.activeLineId);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BackendSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(query);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!debounced.trim()) {
        setResults([]);
        return;
      }
      try {
        const response = await backendApi.search(debounced);
        const filtered = activeLineId ? response.results.filter((item) => item.cluster === activeLineId) : response.results;
        if (active) setResults(filtered.slice(0, 8));
      } catch {
        if (active) setResults([]);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [activeLineId, debounced]);

  const chooseResult = (item: BackendSearchItem) => {
    setQuery(item.title);
    setOpen(false);
    subwayActions.selectNode(item.id);
    onSelect?.(item.id);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (results[0]) {
      chooseResult(results[0]);
      return;
    }

    try {
      const response = await backendApi.search(trimmed);
      const filtered = activeLineId ? response.results.filter((item) => item.cluster === activeLineId) : response.results;
      if (filtered[0]) chooseResult(filtered[0]);
    } catch {
      setResults([]);
    }
  };

  const shellClass =
    variant === 'hero'
      ? 'h-12 bg-theme-card shadow-theme-soft md:h-14'
      : variant === 'compact'
        ? 'h-10 bg-theme-subcard'
        : 'h-11 bg-theme-card shadow-theme-soft';

  return (
    <form className={`relative w-full ${className}`} onSubmit={handleSubmit}>
      <div className={`flex items-center overflow-hidden rounded-md border border-theme-border text-sm focus-within:border-theme-primary ${shellClass}`}>
        <span className='flex h-full w-11 items-center justify-center text-theme-soft' aria-hidden='true'>
          <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
            <circle cx='11' cy='11' r='7' />
            <path d='m20 20-3.5-3.5' />
          </svg>
        </span>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        suppressHydrationWarning
          placeholder={placeholder ?? (activeLineId ? `Search ${humanizeCluster(activeLineId)} line...` : 'Search stations...')}
          className='h-full min-w-0 flex-1 bg-transparent pr-3 text-sm text-theme-text outline-none'
      />
        {query ? (
          <button
            type='button'
            aria-label='Clear search'
            title='Clear search'
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className='mr-1 flex h-8 w-8 items-center justify-center rounded-md text-theme-soft hover:bg-theme-subcard hover:text-theme-text'
          >
            <svg viewBox='0 0 24 24' className='h-4 w-4' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          </button>
        ) : null}
        {showButton ? (
          <button
            type='submit'
            className='mr-1 inline-flex h-8 items-center gap-2 rounded-md bg-theme-primary px-3 text-xs font-semibold text-white hover:bg-theme-secondary md:h-9 md:px-4'
          >
            <svg viewBox='0 0 24 24' className='h-3.5 w-3.5' fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'>
              <circle cx='11' cy='11' r='7' />
              <path d='m20 20-3.5-3.5' />
            </svg>
            {buttonLabel}
          </button>
        ) : null}
      </div>
      {open && results.length > 0 ? (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-theme-border bg-theme-panel shadow-theme-strong'>
          {results.map((item) => (
            <button
              key={item.id}
              type='button'
              className='block w-full border-b border-theme-border px-4 py-2.5 text-left text-sm text-theme-text last:border-b-0 hover:bg-theme-subcard'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseResult(item)}
            >
              <span className='font-medium'>{item.title}</span>
              <span className='ml-2 text-xs text-theme-muted'>{humanizeCluster(item.cluster)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
