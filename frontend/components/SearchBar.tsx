'use client';

import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { humanizeCluster } from '@/lib/cluster';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import type { BackendSearchItem } from '@/types/backend';

function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchBar() {
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

  return (
    <div className='relative w-full'>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        suppressHydrationWarning
        placeholder={activeLineId ? `Search ${activeLineId} line...` : 'Search stations...'}
        className='w-full rounded-xl border border-theme-border bg-theme-panel px-4 py-3 text-sm text-theme-text shadow-theme-soft focus:border-theme-primary focus:outline-none'
      />
      {open && results.length > 0 ? (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-theme-border bg-theme-panel shadow-theme-strong'>
          {results.map((item) => (
            <button
              key={item.id}
              type='button'
              className='block w-full border-b border-theme-border px-4 py-2 text-left text-sm text-theme-text last:border-b-0 hover:bg-theme-card'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setQuery(item.title);
                setOpen(false);
                subwayActions.selectNode(item.id);
              }}
            >
              {item.title}
              <span className='ml-2 text-xs text-theme-muted'>({humanizeCluster(item.cluster)})</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
