"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";

type SearchItem = {
  id: string;
  label: string;
};

type SearchBarProps = {
  items: SearchItem[];
  onSelect: (itemId: string) => void;
};

export function SearchBar({ items, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["label", "id"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return items.slice(0, 8);
    }

    return fuse
      .search(query)
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [fuse, items, query]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Search stations..."
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/30"
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full border-b border-slate-800 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(item.label);
                  setOpen(false);
                  onSelect(item.id);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
