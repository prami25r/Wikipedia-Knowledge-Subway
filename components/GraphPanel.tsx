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

type ClusterLabel = {
  name: string;
  x: number;
  y: number;
  color: string;
};

const DEFAULT_SUMMARY = "Select a station node to view article details and connected stations.";
const LINE_COLORS = ["#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#34d399", "#f97316", "#fb7185", "#facc15"] as const;

function mapToRenderData(graph: KnowledgeGraphDTO): RenderData {
  const groups = new Map<string, typeof graph.nodes>();

  for (const node of graph.nodes) {
    const cluster = node.attributes.color || "default";
    const list = groups.get(cluster) ?? [];
    list.push(node);
    groups.set(cluster, list);
  }

  const nodes: GraphRendererNode[] = [];
  const clusterToColor = new Map<string, string>();
  const orderedClusters = Array.from(groups.keys());

  orderedClusters.forEach((cluster, index) => {
    const lineNodes = (groups.get(cluster) ?? []).slice().sort((a, b) => b.attributes.size - a.attributes.size);
    const lineColor = LINE_COLORS[index % LINE_COLORS.length];
    clusterToColor.set(cluster, lineColor);

    lineNodes.forEach((node, stationIndex) => {
      const spacingX = 6;
      const x = stationIndex * spacingX + Math.sin(stationIndex * 0.65) * 1.1;
      const y = index * 8 + Math.sin(stationIndex * 0.45 + index) * 2.5;

      nodes.push({
        id: node.id,
        x,
        y,
        cluster,
        degree: Math.max(1, Math.round(node.attributes.size)),
        color: lineColor,
      });
    });
  });

  return {
    nodes,
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

function getClusterLabels(nodes: GraphRendererNode[]): ClusterLabel[] {
  const grouped = new Map<string, GraphRendererNode[]>();

  for (const node of nodes) {
    const list = grouped.get(node.cluster) ?? [];
    list.push(node);
    grouped.set(node.cluster, list);
  }

  return Array.from(grouped.entries()).map(([cluster, clusterNodes]) => {
    const avgX = clusterNodes.reduce((sum, node) => sum + node.x, 0) / clusterNodes.length;
    const avgY = clusterNodes.reduce((sum, node) => sum + node.y, 0) / clusterNodes.length;

    return {
      name: cluster,
      x: avgX,
      y: avgY - 2.2,
      color: clusterNodes[0]?.color || "#38bdf8",
    };
  });
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
  const clusterLabels = useMemo(() => getClusterLabels(renderData.nodes), [renderData.nodes]);

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
        <p className="mb-3 text-sm font-medium text-cyan-300">Subway Line Legend</p>
        <div className="flex flex-wrap gap-2">
          {clusterLabels.map((cluster) => (
            <div key={cluster.name} className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200">
              <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: cluster.color }} />
              <span>{cluster.name}</span>
            </div>
          ))}
        </div>
      </div>

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
          clusterLabels={clusterLabels}
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
