import { GraphPanel } from "@/components/GraphPanel";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="space-y-2">
        <p className="inline-flex rounded-full border border-cyan-800 bg-cyan-950/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-300">
          Wikipedia Knowledge Subway
        </p>
        <h1 className="text-3xl font-bold text-slate-100 md:text-4xl">Explore Wikipedia as a connected transit graph</h1>
        <p className="max-w-3xl text-sm text-slate-400 md:text-base">
          Render article relationships as nodes and edges. The data pipeline can be wired to Supabase and OpenAI-powered
          enrichment for intelligent traversal.
        </p>
      </header>
      <GraphPanel />
    </main>
  );
}
