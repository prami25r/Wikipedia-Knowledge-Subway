"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchArticleDetails, fetchKnowledgeGraph } from "@/api/client";
import { GraphRenderer, GraphRendererEdge, GraphRendererNode } from "@/components/GraphRenderer";
import { StationPanel } from "@/components/StationPanel";
import { StationSearchBar } from "@/components/StationSearchBar";
import { createDemoGraphDTO } from "@/lib/graph";
import { buildPathEdgeKeySet, findShortestPath } from "@/lib/pathfinding";
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

  const [routeStart, setRouteStart] = useState<string>("");
  const [routeEnd, setRouteEnd] = useState<string>("");
  const [routePath, setRoutePath] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  const renderData = useMemo(() => mapToRenderData(graph), [graph]);
  const stationNames = useMemo(() => renderData.nodes.map((node) => node.id), [renderData.nodes]);
  const highlightedPathEdgeKeys = useMemo(() => Array.from(buildPathEdgeKeySet(routePath)), [routePath]);

  useEffect(() => {
    let isMounted = true;

    async function loadGraph() {
      try {
        const data = await fetchKnowledgeGraph();
        if (isMounted) {
          setGraph(data);
          if (data.nodes.length > 0) {
            const firstNode = data.nodes[0].id;
            setSelectedTitle(firstNode);
            setRouteStart(firstNode);
            setSelectedSummary(DEFAULT_SUMMARY);
            setConnections([]);
          }
          if (data.nodes.length > 1) {
            setRouteEnd(data.nodes[1].id);
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

  function handleFindRoute() {
    if (!routeStart || !routeEnd) {
      setRouteError("Please choose both start and end stations.");
      setRoutePath([]);
      return;
    }

    const path = findShortestPath(routeStart, routeEnd, renderData.edges);
    if (path.length === 0) {
      setRouteError("No route found in the currently loaded graph segment.");
      setRoutePath([]);
      return;
    }

    setRouteError(null);
    setRoutePath(path);
    setSelectedTitle(path[path.length - 1]);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-cyan-300">Subway Map</h2>
        {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : null}
      </div>

      <StationSearchBar stations={stationNames} onSelect={setSelectedTitle} placeholder="Search stations..." value={selectedTitle} />

      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
        <p className="mb-3 text-sm font-medium text-cyan-300">Route Finder (BFS shortest path)</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <StationSearchBar stations={stationNames} onSelect={setRouteStart} placeholder="Start station" value={routeStart} />
          <StationSearchBar stations={stationNames} onSelect={setRouteEnd} placeholder="End station" value={routeEnd} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleFindRoute}
            className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            Find shortest path
          </button>
          {routeError ? <p className="text-sm text-red-300">{routeError}</p> : null}
        </div>
        {routePath.length > 0 ? (
          <pre className="mt-3 overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-amber-200">
            {JSON.stringify(routePath, null, 2)}
          </pre>
        ) : null}
      </div>

      {error ? <p className="rounded bg-red-900/40 p-3 text-sm text-red-200">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <GraphRenderer
          nodes={renderData.nodes}
          edges={renderData.edges}
          onNodeClick={setSelectedTitle}
          focusedNodeId={selectedTitle}
          highlightedNodeIds={routePath}
          highlightedPathEdgeKeys={highlightedPathEdgeKeys}
        />
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
