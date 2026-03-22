'use client';

import { useEffect, useState } from 'react';
import { backendApi } from '@/lib/backend-api';
import { subwayActions } from '@/lib/frontend-store';
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
        if (active) setResults(response.results.slice(0, 8));
      } catch {
        if (active) setResults([]);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [debounced]);

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
        placeholder='Search stations...'
        className='w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none'
      />
      {open && results.length > 0 ? (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900'>
          {results.map((item) => (
            <button
              key={item.id}
              type='button'
              className='block w-full border-b border-slate-800 px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setQuery(item.title);
                setOpen(false);
                subwayActions.selectNode(item.id);
              }}
            >
              {item.title}
              <span className='ml-2 text-xs text-slate-400'>({item.cluster})</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
