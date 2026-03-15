"use client";

type StationPanelProps = {
  title: string;
  summary: string;
  relatedStations: string[];
  wikipediaUrl: string;
  isLoading?: boolean;
  error?: string | null;
};

export function StationPanel({
  title,
  summary,
  relatedStations,
  wikipediaUrl,
  isLoading = false,
  error = null,
}: StationPanelProps) {
  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 shadow-lg shadow-cyan-950/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-cyan-300">Station Details</h3>
        {isLoading ? (
          <span className="rounded-full border border-cyan-600/40 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">
            Loading...
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-800/70 bg-red-900/40 p-3 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Article title</p>
          <p className="text-base font-medium text-slate-100">{title}</p>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Summary</p>
          <p className="text-sm leading-relaxed text-slate-300">{summary}</p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Related stations</p>
          {relatedStations.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {relatedStations.map((station) => (
                <li
                  key={station}
                  className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-200"
                >
                  {station}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No related stations found.</p>
          )}
        </div>

        <div>
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Open on Wikipedia
          </a>
        </div>
      </div>
    </aside>
  );
}
