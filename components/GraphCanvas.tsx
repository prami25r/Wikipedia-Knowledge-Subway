'use client';

import { useEffect, useMemo, useRef } from 'react';
import Graph from 'graphology';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';

const CLUSTER_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#34d399', '#f97316', '#fb7185', '#facc15'];

type SigmaLike = {
  on: (event: string, listener: (payload: { node: string }) => void) => void;
  setSetting: (key: string, value: unknown) => void;
  getCamera: () => { on: (event: 'updated', listener: () => void) => void; animate: (state: { x: number; y: number; ratio?: number }, options?: { duration: number }) => void };
  refresh: () => void;
  kill: () => void;
};


function edgeKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

export function GraphCanvas() {
  const graphData = useSubwayStore((state) => state.graph);
  const selectedNodeId = useSubwayStore((state) => state.selectedNodeId);
  const hoveredNodeId = useSubwayStore((state) => state.hoveredNodeId);
  const routePath = useSubwayStore((state) => state.routePath);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaLike | null>(null);

  const highlightedEdges = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < routePath.length - 1; i += 1) {
      keys.add(edgeKey(routePath[i], routePath[i + 1]));
    }
    return keys;
  }, [routePath]);

  const graph = useMemo(() => {
    const g = new Graph();
    if (!graphData) return g;

    const clusterColors = new Map<string, string>();
    for (const node of graphData.nodes) {
      const color = clusterColors.get(node.cluster) ?? CLUSTER_COLORS[clusterColors.size % CLUSTER_COLORS.length];
      clusterColors.set(node.cluster, color);
      g.addNode(node.id, {
        x: node.x,
        y: node.y,
        label: node.label,
        cluster: node.cluster,
        baseColor: color,
        color,
        baseSize: Math.max(2, Math.min(15, Math.sqrt(node.degree) + 2)),
        size: Math.max(2, Math.min(15, Math.sqrt(node.degree) + 2)),
      });
    }

    graphData.edges.forEach((edge, index) => {
      if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) return;
      g.addEdgeWithKey(`${edge.source}-${edge.target}-${index}`, edge.source, edge.target, {
        color: '#334155',
        size: 1,
        pathKey: edgeKey(edge.source, edge.target),
      });
    });

    return g;
  }, [graphData]);

  useEffect(() => {
    if (!containerRef.current || graph.order === 0) return;
    let disposed = false;

    const mount = async () => {
      const { default: Sigma } = await import('sigma');
      if (disposed || !containerRef.current) return;

      const sigma = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: false,
        labelDensity: 0.05,
        labelRenderedSizeThreshold: 10,
      });

      const renderer = sigma as unknown as SigmaLike;
      renderer.on('clickNode', ({ node }: { node: string }) => subwayActions.selectNode(node));
      renderer.on('enterNode', ({ node }: { node: string }) => subwayActions.hoverNode(node));
      renderer.on('leaveNode', () => subwayActions.hoverNode(null));

      const camera = renderer.getCamera();
      let movementTimer: ReturnType<typeof setTimeout> | undefined;
      camera.on('updated', () => {
        renderer.setSetting('labelRenderedSizeThreshold', 500);
        if (movementTimer) clearTimeout(movementTimer);
        movementTimer = setTimeout(() => renderer.setSetting('labelRenderedSizeThreshold', 10), 120);
      });

      sigmaRef.current = renderer;
    };

    void mount();

    return () => {
      disposed = true;
      sigmaRef.current?.kill();
      sigmaRef.current = null;
    };
  }, [graph]);

  useEffect(() => {
    if (!sigmaRef.current) return;

    graph.forEachNode((node, attrs) => {
      graph.setNodeAttribute(node, 'color', attrs.baseColor);
      graph.setNodeAttribute(node, 'size', attrs.baseSize);
    });

    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(edge, 'color', '#334155');
      graph.setEdgeAttribute(edge, 'size', 1);
    });

    if (hoveredNodeId && graph.hasNode(hoveredNodeId)) {
      const neighborhood = new Set([hoveredNodeId, ...graph.neighbors(hoveredNodeId)]);
      graph.forEachNode((node) => {
        if (!neighborhood.has(node)) graph.setNodeAttribute(node, 'color', '#1e293b');
      });
    }

    if (selectedNodeId && graph.hasNode(selectedNodeId)) {
      const attrs = graph.getNodeAttributes(selectedNodeId);
      graph.setNodeAttribute(selectedNodeId, 'color', '#f8fafc');
      graph.setNodeAttribute(selectedNodeId, 'size', attrs.baseSize * 1.25);
    }

    graph.forEachEdge((edge, attrs) => {
      if (highlightedEdges.has(attrs.pathKey)) {
        graph.setEdgeAttribute(edge, 'color', '#f59e0b');
        graph.setEdgeAttribute(edge, 'size', 3);
      }
    });

    if (selectedNodeId && graph.hasNode(selectedNodeId)) {
      const camera = sigmaRef.current.getCamera();
      const attrs = graph.getNodeAttributes(selectedNodeId);
      camera.animate({ x: attrs.x, y: attrs.y, ratio: 0.35 }, { duration: 350 });
    }

    sigmaRef.current.refresh();
  }, [graph, selectedNodeId, hoveredNodeId, highlightedEdges]);

  return <div ref={containerRef} className='h-[72vh] w-full rounded-xl border border-slate-700 bg-slate-950' />;
}
