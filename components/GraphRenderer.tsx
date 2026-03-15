"use client";

import { useEffect, useMemo, useRef } from "react";
import Graph from "graphology";

export type GraphRendererNode = {
  id: string;
  x: number;
  y: number;
  cluster: string;
  degree: number;
  color?: string;
};

export type GraphRendererEdge = {
  source: string;
  target: string;
  id?: string;
};

type ClusterLabel = {
  name: string;
  x: number;
  y: number;
  color: string;
};

type GraphRendererProps = {
  nodes: GraphRendererNode[];
  edges: GraphRendererEdge[];
  className?: string;
  focusedNodeId?: string | null;
  highlightedNodeIds?: string[];
  highlightedPathEdgeKeys?: string[];
  clusterLabels?: ClusterLabel[];
  onNodeClick?: (nodeId: string) => void;
};

const CLUSTER_COLORS = ["#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#c084fc", "#fb7185", "#f97316", "#34d399", "#facc15", "#60a5fa"] as const;
const HIGHLIGHT_COLOR = "#f8fafc";
const PATH_NODE_COLOR = "#f59e0b";
const PATH_EDGE_COLOR = "#fbbf24";
const INTERCHANGE_EDGE_COLOR = "#334155";

function getClusterColor(cluster: string, clusterMap: Map<string, string>) {
  const existing = clusterMap.get(cluster);
  if (existing) return existing;
  const nextColor = CLUSTER_COLORS[clusterMap.size % CLUSTER_COLORS.length];
  clusterMap.set(cluster, nextColor);
  return nextColor;
}

function getNodeSize(degree: number, minDegree: number, maxDegree: number) {
  if (maxDegree === minDegree) return 8;
  const normalized = (degree - minDegree) / (maxDegree - minDegree);
  return 5 + normalized * 11;
}

function toCanonicalEdgeKey(source: string, target: string) {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

function getPercent(value: number, min: number, max: number) {
  if (max <= min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function GraphRenderer({
  nodes,
  edges,
  className,
  focusedNodeId,
  highlightedNodeIds = [],
  highlightedPathEdgeKeys = [],
  clusterLabels = [],
  onNodeClick,
}: GraphRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<{
    kill: () => void;
    on: (event: string, handler: (payload: { node: string }) => void) => void;
    getCamera: () => { animate: (state: { x: number; y: number; ratio?: number }, options?: { duration: number }) => void };
  } | null>(null);

  const graph = useMemo(() => {
    const instance = new Graph();
    const clusterMap = new Map<string, string>();
    const clusterByNode = new Map<string, string>();
    const degrees = nodes.map((node) => node.degree);
    const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 1;

    for (const node of nodes) {
      if (!instance.hasNode(node.id)) {
        const size = getNodeSize(node.degree, minDegree, maxDegree);
        const color = node.color ?? getClusterColor(node.cluster, clusterMap);
        clusterByNode.set(node.id, node.cluster);

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
      if (!instance.hasNode(edge.source) || !instance.hasNode(edge.target)) return;

      const sourceCluster = clusterByNode.get(edge.source);
      const targetCluster = clusterByNode.get(edge.target);
      const isSameLine = sourceCluster && targetCluster && sourceCluster === targetCluster;
      const lineColor = isSameLine ? instance.getNodeAttribute(edge.source, "baseColor") : INTERCHANGE_EDGE_COLOR;
      const lineWidth = isSameLine ? 3.2 : 1.2;

      const edgeKey = edge.id ?? `${edge.source}->${edge.target}-${index}`;
      if (!instance.hasEdge(edgeKey)) {
        instance.addEdgeWithKey(edgeKey, edge.source, edge.target, {
          type: "curve",
          color: lineColor,
          size: lineWidth,
          baseColor: lineColor,
          baseSize: lineWidth,
          canonicalPathKey: toCanonicalEdgeKey(edge.source, edge.target),
        });
      }
    });

    return instance;
  }, [nodes, edges]);

  const bounds = useMemo(() => {
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    return {
      minX: xs.length > 0 ? Math.min(...xs) : 0,
      maxX: xs.length > 0 ? Math.max(...xs) : 1,
      minY: ys.length > 0 ? Math.min(...ys) : 0,
      maxY: ys.length > 0 ? Math.max(...ys) : 1,
    };
  }, [nodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    const setupRenderer = async () => {
      const { default: Sigma } = await import("sigma");
      if (disposed || !containerRef.current) return;

      const renderer = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: false,
        defaultEdgeType: "curve",
        renderEdgeLabels: false,
        labelDensity: 0.06,
        labelGridCellSize: 100,
        labelRenderedSizeThreshold: 11,
        zoomToSizeRatioFunction: (ratio: number) => ratio,
        zoomDuration: 300,
        zIndex: true,
      });

      if (onNodeClick) {
        renderer.on("clickNode", ({ node }) => onNodeClick(node));
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
    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, "color", attrs.baseColor ?? attrs.color);
      graph.setNodeAttribute(node, "size", attrs.baseSize ?? attrs.size);
    });

    graph.forEachEdge((edge, attrs) => {
      graph.setEdgeAttribute(edge, "color", attrs.baseColor ?? attrs.color);
      graph.setEdgeAttribute(edge, "size", attrs.baseSize ?? attrs.size);
    });

    for (const nodeId of highlightedNodeIds) {
      if (graph.hasNode(nodeId)) {
        const attrs = graph.getNodeAttributes(nodeId);
        graph.setNodeAttribute(nodeId, "color", PATH_NODE_COLOR);
        graph.setNodeAttribute(nodeId, "size", (attrs.baseSize ?? attrs.size) * 1.18);
      }
    }

    const highlightedEdgeSet = new Set(highlightedPathEdgeKeys);
    graph.forEachEdge((edge, attrs) => {
      if (highlightedEdgeSet.has(attrs.canonicalPathKey)) {
        graph.setEdgeAttribute(edge, "color", PATH_EDGE_COLOR);
        graph.setEdgeAttribute(edge, "size", 4.1);
      }
    });

    if (focusedNodeId && graph.hasNode(focusedNodeId)) {
      const focusNode = graph.getNodeAttributes(focusedNodeId);
      graph.setNodeAttribute(focusedNodeId, "color", HIGHLIGHT_COLOR);
      graph.setNodeAttribute(focusedNodeId, "size", (focusNode.baseSize ?? focusNode.size) * 1.28);

      const renderer = rendererRef.current;
      if (renderer) {
        renderer.getCamera().animate({ x: focusNode.x, y: focusNode.y, ratio: 0.32 }, { duration: 450 });
      }
    }
  }, [focusedNodeId, highlightedNodeIds, highlightedPathEdgeKeys, graph]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className ?? "h-[620px] w-full rounded-lg border border-slate-700 bg-slate-950"} />
      {clusterLabels.map((label) => (
        <div
          key={label.name}
          className="pointer-events-none absolute rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-xs font-semibold"
          style={{
            left: `${getPercent(label.x, bounds.minX, bounds.maxX)}%`,
            top: `${getPercent(label.y, bounds.minY, bounds.maxY)}%`,
            color: label.color,
            transform: "translate(-50%, -50%)",
          }}
        >
          {label.name}
        </div>
      ))}
    </div>
  );
}