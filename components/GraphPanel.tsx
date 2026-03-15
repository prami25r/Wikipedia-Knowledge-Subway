"use client";

import { useEffect, useState } from "react";
import { GraphRenderer } from "@/components/GraphRenderer";
import { fetchKnowledgeGraph } from "@/api/client";
import { createDemoGraphDTO } from "@/lib/graph";
import { KnowledgeGraphDTO } from "@/types/graph";

function mapToRenderData(graph: KnowledgeGraphDTO) {
  return {
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      x: node.attributes.x,
      y: node.attributes.y,
      cluster: node.attributes.color || "default",
      degree: Math.max(1, Math.round(node.attributes.size)),
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

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
      <GraphRenderer {...mapToRenderData(graph)} />
    </section>
  );
}
