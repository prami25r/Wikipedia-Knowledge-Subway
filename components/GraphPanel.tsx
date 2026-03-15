"use client";

import { useEffect, useState } from "react";
import { SigmaGraph } from "@/components/SigmaGraph";
import { fetchKnowledgeGraph } from "@/api/client";
import { createDemoGraphDTO } from "@/lib/graph";
import { KnowledgeGraphDTO } from "@/types/graph";

export function GraphPanel() {
  const [graph, setGraph] = useState<KnowledgeGraphDTO>(createDemoGraphDTO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGraph() {
      try {
        const data = await fetchKnowledgeGraph();
        if (isMounted) {
          setGraph(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGraph();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-cyan-300">Subway Map</h2>
        {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : null}
      </div>
      {error ? <p className="rounded bg-red-900/40 p-3 text-sm text-red-200">{error}</p> : null}
      <SigmaGraph data={graph} />
    </section>
  );
}
