"use client";

import { useEffect, useMemo, useRef } from "react";
import Graph from "graphology";

export type GraphRendererNode = {
  id: string;
  x: number;
  y: number;
  cluster: string;
  degree: number;
};

export type GraphRendererEdge = {
  source: string;
  target: string;
  id?: string;
};

type GraphRendererProps = {
  nodes: GraphRendererNode[];
  edges: GraphRendererEdge[];
  className?: string;
  focusedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
};

const CLUSTER_COLORS = [
  "#22d3ee",
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#fb7185",
  "#f97316",
  "#34d399",
  "#facc15",
  "#60a5fa",
] as const;

const HIGHLIGHT_COLOR = "#f8fafc";

function getClusterColor(cluster: string, clusterMap: Map<string, string>) {
  const existing = clusterMap.get(cluster);
  if (existing) return existing;

  const nextColor = CLUSTER_COLORS[clusterMap.size % CLUSTER_COLORS.length];
  clusterMap.set(cluster, nextColor);
  return nextColor;
}

function getNodeSize(degree: number, minDegree: number, maxDegree: number) {
  if (maxDegree === minDegree) {
    return 7;
  }

  const normalized = (degree - minDegree) / (maxDegree - minDegree);
  return 4 + normalized * 14;
}

export function GraphRenderer({ nodes, edges, className, focusedNodeId, onNodeClick }: GraphRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<{
    kill: () => void;
    on: (event: string, handler: (payload: { node: string }) => void) => void;
    getCamera: () => { animate: (state: { x: number; y: number; ratio?: number }, options?: { duration: number }) => void };
  } | null>(null);

  const graph = useMemo(() => {
    const instance = new Graph();
    const clusterMap = new Map<string, string>();

    const degrees = nodes.map((node) => node.degree);
    const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 1;

    for (const node of nodes) {
      if (!instance.hasNode(node.id)) {
        const size = getNodeSize(node.degree, minDegree, maxDegree);
        const color = getClusterColor(node.cluster, clusterMap);

        instance.addNode(node.id, {
          label: node.id,
          x: node.x,
          y: node.y,
          size,
          degree: node.degree,
          cluster: node.cluster,
          color,
          baseColor: color,
          baseSize: size,
        });
      }
    }

    edges.forEach((edge, index) => {
      if (!instance.hasNode(edge.source) || !instance.hasNode(edge.target)) {
        return;
      }

      const edgeKey = edge.id ?? `${edge.source}->${edge.target}-${index}`;
      if (!instance.hasEdge(edgeKey)) {
        instance.addEdgeWithKey(edgeKey, edge.source, edge.target, {
          color: "#334155",
          size: 1,
        });
      }
    });

    return instance;
  }, [nodes, edges]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let disposed = false;

    const setupRenderer = async () => {
      const { default: Sigma } = await import("sigma");
      if (disposed || !containerRef.current) {
        return;
      }

      const renderer = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: false,
        defaultEdgeType: "line",
        renderEdgeLabels: false,
        labelDensity: 0.08,
        labelGridCellSize: 120,
        labelRenderedSizeThreshold: 12,
        zoomToSizeRatioFunction: (ratio: number) => ratio,
        zoomDuration: 250,
        zIndex: true,
      });

      if (onNodeClick) {
        renderer.on("clickNode", ({ node }) => {
          onNodeClick(node);
        });
      }

      rendererRef.current = renderer;
    };

    void setupRenderer();

    return () => {
      disposed = true;
      rendererRef.current?.kill();
      rendererRef.current = null;
    };
  }, [graph, onNodeClick]);

  useEffect(() => {
    if (!focusedNodeId || !graph.hasNode(focusedNodeId)) {
      return;
    }

    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, "color", attrs.baseColor ?? attrs.color);
      graph.setNodeAttribute(node, "size", attrs.baseSize ?? attrs.size);
    });

    const focusNode = graph.getNodeAttributes(focusedNodeId);
    graph.setNodeAttribute(focusedNodeId, "color", HIGHLIGHT_COLOR);
    graph.setNodeAttribute(focusedNodeId, "size", (focusNode.baseSize ?? focusNode.size) * 1.25);

    const renderer = rendererRef.current;
    if (renderer) {
      renderer.getCamera().animate(
        {
          x: focusNode.x,
          y: focusNode.y,
          ratio: 0.35,
        },
        { duration: 450 },
      );
    }
  }, [focusedNodeId, graph]);
      renderer?.kill();
    };
  }, [graph]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[620px] w-full rounded-lg border border-slate-700 bg-slate-950"}
    />
  );
}
