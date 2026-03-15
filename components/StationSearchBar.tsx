"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";

type StationSearchBarProps = {
  stations: string[];
  onSelect: (station: string) => void;
};

export function StationSearchBar({ stations, onSelect }: StationSearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(stations, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [stations],
  );

  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return stations.slice(0, 8);
    }

    return fuse
      .search(query)
      .slice(0, 8)
      .map((result) => result.item);
  }, [fuse, query, stations]);

  function handleSelect(station: string) {
    setQuery(station);
    setOpen(false);
    onSelect(station);
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search stations..."
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/30"
      />

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {suggestions.map((station) => (
            <li key={station}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(station)}
                className="w-full border-b border-slate-800 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {station}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
