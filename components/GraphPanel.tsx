"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchArticleDetails, fetchKnowledgeGraph } from "@/api/client";
import { GraphRenderer, GraphRendererEdge, GraphRendererNode } from "@/components/GraphRenderer";
import { StationPanel } from "@/components/StationPanel";
import { createDemoGraphDTO } from "@/lib/graph";
import { KnowledgeGraphDTO } from "@/types/graph";

type RenderData = {
  nodes: GraphRendererNode[];
  edges: GraphRendererEdge[];
};

const DEFAULT_SUMMARY = "Select a station node to view article details and connected stations.";

function mapToRenderData(graph: KnowledgeGraphDTO): RenderData {
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

function getWikipediaLink(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
}

export function GraphPanel() {
  const [graph, setGraph] = useState<KnowledgeGraphDTO>(createDemoGraphDTO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTitle, setSelectedTitle] = useState<string>("Wikipedia");
  const [selectedSummary, setSelectedSummary] = useState<string>(DEFAULT_SUMMARY);
  const [connections, setConnections] = useState<string[]>([]);
  const [stationLoading, setStationLoading] = useState(false);
  const [stationError, setStationError] = useState<string | null>(null);

  const renderData = useMemo(() => mapToRenderData(graph), [graph]);

  useEffect(() => {
    let isMounted = true;

    async function loadGraph() {
      try {
        const data = await fetchKnowledgeGraph();
        if (isMounted) {
          setGraph(data);
          if (data.nodes.length > 0) {
            setSelectedTitle(data.nodes[0].id);
            setSelectedSummary(DEFAULT_SUMMARY);
            setConnections([]);
          }
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

  useEffect(() => {
    let isMounted = true;

    async function loadStation(title: string) {
      setStationLoading(true);
      setStationError(null);

      try {
        const article = await fetchArticleDetails(title);
        if (isMounted) {
          setSelectedSummary(article.summary || "No summary available for this article.");
          setConnections(article.connections);
        }
      } catch (loadError) {
        if (isMounted) {
          setSelectedSummary("No summary available for this article.");
          setConnections([]);
          setStationError(loadError instanceof Error ? loadError.message : "Unable to load station details");
        }
      } finally {
        if (isMounted) {
          setStationLoading(false);
        }
      }
    }

    if (selectedTitle) {
      void loadStation(selectedTitle);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedTitle]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-cyan-300">Subway Map</h2>
        {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : null}
      </div>

      {error ? <p className="rounded bg-red-900/40 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <GraphRenderer nodes={renderData.nodes} edges={renderData.edges} onNodeClick={setSelectedTitle} />
        <StationPanel
          title={selectedTitle}
          summary={selectedSummary}
          relatedStations={connections}
          wikipediaUrl={getWikipediaLink(selectedTitle)}
          isLoading={stationLoading}
          error={stationError}
        />
      </div>
    </section>
  );
}
