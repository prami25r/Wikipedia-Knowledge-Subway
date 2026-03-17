"use client";

type StationPanelProps = {
  title: string;
  summary: string;
  relatedStations: string[];
  wikipediaUrl: string;
  isLoading?: boolean;
  error?: string | null;
  cluster?: string;
};

export function StationPanel({
  title,
  summary,
  relatedStations,
  wikipediaUrl,
  isLoading,
  error,
  cluster,
}: StationPanelProps) {
  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 shadow-lg shadow-cyan-950/20">
      <h3 className="mb-4 text-lg font-semibold text-cyan-300">
        Station Details
      </h3>
      <div className="space-y-4">
        {error ? (
          <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <span>Loading article details...</span>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                Article title
              </p>
              <p className="text-base font-medium text-slate-100 truncate">
                {title}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                Summary
              </p>
              <p className="text-sm text-slate-200 leading-relaxed line-clamp-6">
                {summary}
              </p>
            </div>
            {cluster ? (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                  Cluster / Line
                </p>
                <p className="text-sm text-slate-300">{cluster}</p>
              </div>
            ) : null}
            {relatedStations.length > 0 ? (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">
                  Related Stations ({relatedStations.length})
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto">
                  {relatedStations.map((station) => (
                    <li key={station} className="text-xs">
                      •{" "}
                      <span className="font-medium text-cyan-300 hover:text-cyan-200 cursor-pointer transition-colors">
                        {station}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <a
              href={wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Open on Wikipedia →
            </a>
          </>
        )}
      </div>
    </aside>
  );
}
