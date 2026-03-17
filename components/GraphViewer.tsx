"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import { SearchBar } from "@/components/SearchBar";
import { StationPanel } from "@/components/StationPanel";
import {
  LayoutGraphData,
  LayoutGraphNode,
  loadGraphData,
} from "@/lib/loadGraph";

const CLUSTER_COLORS: Record<string, string> = {
  arts: "#ff006e",
  biology: "#06d6a0",
  physics: "#8338ec",
  technology: "#3a86ff",
  history: "#fb5607",
  mathematics: "#ffbe0b",
  philosophy: "#ff66c4",
  economics: "#2ec4b6",
  geography: "#8d6e63",
};

const FALLBACK_NODE_COLOR = "#38bdf8";
const DIM_COLOR = "#1f2937";

type SigmaInstance = {
  kill: () => void;
  on: (event: string, cb: (payload: { node: string }) => void) => void;
  getCamera: () => {
    animate: (
      state: { x: number; y: number; ratio?: number },
      options?: { duration: number },
    ) => void;
  };
  refresh: () => void;
};

function colorForCluster(cluster: string) {
  return CLUSTER_COLORS[cluster] ?? FALLBACK_NODE_COLOR;
}

export function GraphViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SigmaInstance | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const [dataset, setDataset] = useState<LayoutGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodeById = useMemo(() => {
    return new Map<string, LayoutGraphNode>(
      (dataset?.nodes ?? []).map((node) => [node.id, node]),
    );
  }, [dataset]);

  const searchItems = useMemo(
    () =>
      (dataset?.nodes ?? []).map((node) => ({
        id: node.id,
        label: node.label,
      })),
    [dataset],
  );

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        const loaded = await loadGraphData();
        if (!isMounted) return;
        setDataset(loaded);
        if (loaded.nodes.length > 0) {
          setSelectedNodeId(loaded.nodes[0].id);
        }
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load graph.",
        );
      }
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !dataset) {
      return;
    }

    const graph = new Graph();
    const degreeByNode = new Map<string, number>();

    for (const node of dataset.nodes) {
      degreeByNode.set(node.id, 0);
    }

    for (const edge of dataset.edges) {
      degreeByNode.set(edge.source, (degreeByNode.get(edge.source) ?? 0) + 1);
      degreeByNode.set(edge.target, (degreeByNode.get(edge.target) ?? 0) + 1);
    }

    const degrees = Array.from(degreeByNode.values());
    const minDegree = degrees.length ? Math.min(...degrees) : 0;
    const maxDegree = degrees.length ? Math.max(...degrees) : 1;

    const sizeForDegree = (degree: number) => {
      if (maxDegree === minDegree) return 5;
      const normalized = (degree - minDegree) / (maxDegree - minDegree);
      return 3 + normalized * 9;
    };

    for (const node of dataset.nodes) {
      const baseColor = colorForCluster(node.cluster);
      const degree = degreeByNode.get(node.id) ?? 0;
      const size = sizeForDegree(degree);

      graph.addNode(node.id, {
        label: node.label,
        x: node.x,
        y: node.y,
        color: baseColor,
        baseColor,
        size,
        baseSize: size,
        cluster: node.cluster,
      });
    }

    dataset.edges.forEach((edge, index) => {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) return;
      const edgeKey = `${edge.source}-${edge.target}-${index}`;
      if (!graph.hasEdge(edgeKey)) {
        graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
          color: "#334155",
          baseColor: "#334155",
          size: 1,
          baseSize: 1,
        });
      }
    });

    graphRef.current = graph;

    let disposed = false;

    const setup = async () => {
      const { default: Sigma } = await import("sigma");
      if (disposed || !containerRef.current) return;

      const renderer = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: false,
        defaultEdgeType: "line",
        renderEdgeLabels: false,
        labelDensity: 0.08,
        labelGridCellSize: 120,
        labelRenderedSizeThreshold: 9,
        zoomToSizeRatioFunction: (ratio: number) => ratio,
        zoomDuration: 300,
        zIndex: true,
      }) as SigmaInstance;

      renderer.on("clickNode", ({ node }) => {
        setSelectedNodeId(node);
      });

      renderer.on("enterNode", ({ node }) => {
        setHoveredNodeId(node);
      });

      renderer.on("leaveNode", () => {
        setHoveredNodeId(null);
      });

      rendererRef.current = renderer;
    };

    void setup();

    return () => {
      disposed = true;
      rendererRef.current?.kill();
      rendererRef.current = null;
      graphRef.current = null;
    };
  }, [dataset]);

  useEffect(() => {
    const graph = graphRef.current;
    const renderer = rendererRef.current;
    if (!graph || !renderer) {
      return;
    }

    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, "color", attrs.baseColor ?? attrs.color);
      graph.setNodeAttribute(node, "size", attrs.baseSize ?? attrs.size);
    });

    graph.forEachEdge((edge, attrs) => {
      graph.setEdgeAttribute(edge, "color", attrs.baseColor ?? attrs.color);
      graph.setEdgeAttribute(edge, "size", attrs.baseSize ?? attrs.size);
    });

    if (hoveredNodeId && graph.hasNode(hoveredNodeId)) {
      const neighborhood = new Set<string>([
        hoveredNodeId,
        ...graph.neighbors(hoveredNodeId),
      ]);

      graph.forEachNode((node, attrs) => {
        if (!neighborhood.has(node)) {
          graph.setNodeAttribute(node, "color", DIM_COLOR);
        } else {
          graph.setNodeAttribute(
            node,
            "size",
            (attrs.baseSize ?? attrs.size) * 1.15,
          );
        }
      });

      graph.forEachEdge((edge, attrs, source, target) => {
        if (!neighborhood.has(source) || !neighborhood.has(target)) {
          graph.setEdgeAttribute(edge, "color", "#1e293b");
        } else {
          graph.setEdgeAttribute(
            edge,
            "size",
            (attrs.baseSize ?? attrs.size) + 0.8,
          );
        }
      });
    }

    if (selectedNodeId && graph.hasNode(selectedNodeId)) {
      const attrs = graph.getNodeAttributes(selectedNodeId);
      graph.setNodeAttribute(selectedNodeId, "color", "#f8fafc");
      graph.setNodeAttribute(
        selectedNodeId,
        "size",
        (attrs.baseSize ?? attrs.size) * 1.28,
      );
    }

    renderer.refresh();
  }, [hoveredNodeId, selectedNodeId]);

  const selectedNode = selectedNodeId
    ? (nodeById.get(selectedNodeId) ?? null)
    : null;

  function centerOnNode(nodeId: string) {
    const graph = graphRef.current;
    const renderer = rendererRef.current;
    if (!graph || !renderer || !graph.hasNode(nodeId)) {
      return;
    }

    setSelectedNodeId(nodeId);
    const attrs = graph.getNodeAttributes(nodeId);
    renderer.getCamera().animate(
      {
        x: attrs.x,
        y: attrs.y,
        ratio: 0.22,
      },
      { duration: 450 },
    );
  }

  if (error) {
    return (
      <p className="rounded bg-red-900/40 p-3 text-sm text-red-200">{error}</p>
    );
  }

  return (
    <section className="space-y-4">
      <SearchBar items={searchItems} onSelect={centerOnNode} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div
          ref={containerRef}
          className="h-[720px] w-full rounded-lg border border-slate-700 bg-slate-950"
        />
        {selectedNode ? (
          <StationPanel
            title={selectedNode.label}
            summary="Loading article summary..."
            relatedStations={[]}
            wikipediaUrl={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedNode.label.replace(/\s+/g, "_"))}`}
            cluster={selectedNode.cluster}
            isLoading={true}
          />
        ) : null}
      </div>
    </section>
  );
}
