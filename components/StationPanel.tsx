"use client";

type StationPanelProps = {
  title: string;
  cluster: string;
};

function getWikipediaUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
}

export function StationPanel({ title, cluster }: StationPanelProps) {
  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 shadow-lg shadow-cyan-950/20">
      <h3 className="mb-4 text-lg font-semibold text-cyan-300">Station Details</h3>
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Article title</p>
          <p className="text-base font-medium text-slate-100">{title}</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-slate-400">Cluster / Line</p>
          <p className="text-sm text-slate-300">{cluster}</p>
        </div>
        <a
          href={getWikipediaUrl(title)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
        >
          Open on Wikipedia
        </a>
      </div>
    </aside>
  );
}
