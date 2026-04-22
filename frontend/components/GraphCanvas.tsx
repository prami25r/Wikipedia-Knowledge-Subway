'use client';

import { useEffect, useMemo, useRef } from 'react';
import Graph from 'graphology';
import { useTheme } from '@/components/ThemeProvider';
import { subwayActions, useSubwayStore } from '@/lib/frontend-store';
import { readThemeGraphPalette } from '@/lib/theme';

type SigmaLike = {
  on: (event: string, listener: (payload: { node: string }) => void) => void;
  setSetting: (key: string, value: unknown) => void;
  getCamera: () => {
    on: (event: 'updated', listener: () => void) => void;
    animate: (state: { x: number; y: number; ratio?: number }, options?: { duration: number }) => void;
  };
  refresh: () => void;
  kill: () => void;
};

type HoverSettings = {
  labelFont: string;
  labelSize: number;
  labelWeight: string | number;
};

type HoverNodeData = {
  label?: string | null;
  size: number;
  x: number;
  y: number;
};

function edgeKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

function getNodesWithinRadius(graph: Graph, centerNode: string, radius: number): Set<string> {
  const visited = new Set<string>([centerNode]);
  let frontier = new Set<string>([centerNode]);

  for (let depth = 0; depth < radius; depth += 1) {
    const next = new Set<string>();
    frontier.forEach((nodeId) => {
      graph.neighbors(nodeId).forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.add(neighbor);
        }
      });
    });
    frontier = next;
    if (frontier.size === 0) break;
  }

  return visited;
}

function drawThemedNodeHover(
  context: CanvasRenderingContext2D,
  node: HoverNodeData,
  settings: HoverSettings,
  colors: ReturnType<typeof readThemeGraphPalette>,
) {
  const padding = 6;
  const labelSize = settings.labelSize;

  context.font = `${settings.labelWeight} ${labelSize}px ${settings.labelFont}`;
  context.fillStyle = colors.hoverFillColor;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 14;
  context.shadowColor = colors.hoverShadowColor;

  if (typeof node.label === 'string') {
    const textWidth = context.measureText(node.label).width;
    const chipWidth = Math.round(textWidth + 12);
    const chipHeight = Math.round(labelSize + 2 * padding);
    const radius = Math.max(node.size, labelSize / 2) + padding;
    const angle = Math.asin(chipHeight / 2 / radius);
    const offset = Math.sqrt(Math.abs(radius ** 2 - (chipHeight / 2) ** 2));

    context.beginPath();
    context.moveTo(node.x + offset, node.y + chipHeight / 2);
    context.lineTo(node.x + radius + chipWidth, node.y + chipHeight / 2);
    context.lineTo(node.x + radius + chipWidth, node.y - chipHeight / 2);
    context.lineTo(node.x + offset, node.y - chipHeight / 2);
    context.arc(node.x, node.y, radius, angle, -angle);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(node.x, node.y, node.size + padding, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  context.shadowBlur = 0;

  if (typeof node.label === 'string') {
    context.fillStyle = colors.hoverTextColor;
    context.fillText(node.label, node.x + node.size + 8, node.y + labelSize / 3);
  }
}

export function GraphCanvas() {
  useTheme();
  const graphData = useSubwayStore((state) => state.graph);
  const activeLineId = useSubwayStore((state) => state.activeLineId);
  const selectedNodeId = useSubwayStore((state) => state.selectedNodeId);
  const hoveredNodeId = useSubwayStore((state) => state.hoveredNodeId);
  const routePath = useSubwayStore((state) => state.routePath);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaLike | null>(null);

  const graphTheme = readThemeGraphPalette();

  const highlightedEdges = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < routePath.length - 1; i += 1) {
      keys.add(edgeKey(routePath[i], routePath[i + 1]));
    }
    return keys;
  }, [routePath]);
  const initialGraphThemeRef = useRef(graphTheme);

  const graph = useMemo(() => {
    const g = new Graph();
    if (!graphData) return g;
    const initialGraphTheme = initialGraphThemeRef.current;

    const clusterIndexes = new Map<string, number>();
    for (const node of graphData.nodes) {
      if (!clusterIndexes.has(node.cluster)) {
        clusterIndexes.set(node.cluster, clusterIndexes.size);
      }

      const clusterIndex = clusterIndexes.get(node.cluster) ?? 0;
      const color = initialGraphTheme.clusterColors[clusterIndex % initialGraphTheme.clusterColors.length];
      const size = Math.max(2, Math.min(15, Math.sqrt(node.degree) + 2));

      g.addNode(node.id, {
        x: node.x,
        y: node.y,
        label: node.label,
        cluster: node.cluster,
        clusterIndex,
        baseColor: color,
        color,
        baseSize: size,
        size,
      });
    }

    graphData.edges.forEach((edge, index) => {
      if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) return;
      g.addEdgeWithKey(`${edge.source}-${edge.target}-${index}`, edge.source, edge.target, {
        baseColor: initialGraphTheme.defaultEdgeColor,
        color: initialGraphTheme.defaultEdgeColor,
        size: 1,
        pathKey: edgeKey(edge.source, edge.target),
        sourceCluster: g.getNodeAttribute(edge.source, 'cluster'),
        targetCluster: g.getNodeAttribute(edge.target, 'cluster'),
      });
    });

    return g;
  }, [graphData]);

  useEffect(() => {
    if (!containerRef.current || graph.order === 0) return;
    let disposed = false;

    const mount = async () => {
      const initialGraphTheme = initialGraphThemeRef.current;
      const { default: Sigma } = await import('sigma');
      if (disposed || !containerRef.current) return;

      const sigma = new Sigma(graph, containerRef.current, {
        defaultEdgeColor: initialGraphTheme.defaultEdgeColor,
        defaultNodeColor: initialGraphTheme.clusterColors[0],
        defaultDrawNodeHover: (
          context: CanvasRenderingContext2D,
          node: HoverNodeData,
          settings: HoverSettings,
        ) => drawThemedNodeHover(context, node, settings, initialGraphTheme),
        labelColor: {
          color: initialGraphTheme.labelColor,
        },
        labelDensity: 0.05,
        labelRenderedSizeThreshold: 10,
        renderEdgeLabels: false,
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
    if (!graphData?.nodes.length) return;

    const key = 'wks_demo_seen_v1';
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, '1');
    } catch {
      return;
    }

    const demoNodes = graphData.nodes.slice(0, 4);
    demoNodes.forEach((node, index) => {
      window.setTimeout(() => subwayActions.selectNode(node.id), index * 700);
    });
  }, [graphData]);

  useEffect(() => {
    if (!sigmaRef.current) return;

    sigmaRef.current.setSetting('defaultEdgeColor', graphTheme.defaultEdgeColor);
    sigmaRef.current.setSetting('defaultNodeColor', graphTheme.clusterColors[0]);
    sigmaRef.current.setSetting('labelColor', { color: graphTheme.labelColor });
    sigmaRef.current.setSetting('defaultDrawNodeHover', (context: CanvasRenderingContext2D, node: HoverNodeData, settings: HoverSettings) =>
      drawThemedNodeHover(context, node, settings, graphTheme),
    );
  }, [graphTheme]);

  useEffect(() => {
    if (!sigmaRef.current) return;

    graph.forEachNode((node, attrs) => {
      const baseColor = graphTheme.clusterColors[attrs.clusterIndex % graphTheme.clusterColors.length];
      graph.setNodeAttribute(node, 'baseColor', baseColor);
      graph.setNodeAttribute(node, 'color', baseColor);
      graph.setNodeAttribute(node, 'size', attrs.baseSize);
    });

    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(edge, 'baseColor', graphTheme.defaultEdgeColor);
      graph.setEdgeAttribute(edge, 'color', graphTheme.defaultEdgeColor);
      graph.setEdgeAttribute(edge, 'size', 1);
    });

    if (activeLineId) {
      graph.forEachNode((node, attrs) => {
        if (attrs.cluster !== activeLineId) {
          graph.setNodeAttribute(node, 'color', graphTheme.mutedNodeColor);
          graph.setNodeAttribute(node, 'size', Math.max(1.6, attrs.baseSize * 0.82));
        }
      });

      graph.forEachEdge((edge, attrs) => {
        if (attrs.sourceCluster !== activeLineId || attrs.targetCluster !== activeLineId) {
          graph.setEdgeAttribute(edge, 'color', graphTheme.mutedEdgeColor);
          graph.setEdgeAttribute(edge, 'size', 0.45);
        }
      });
    }

    if (hoveredNodeId && graph.hasNode(hoveredNodeId)) {
      const neighborhood = new Set([hoveredNodeId, ...graph.neighbors(hoveredNodeId)]);
      graph.forEachNode((node) => {
        if (!neighborhood.has(node)) graph.setNodeAttribute(node, 'color', graphTheme.fadedNodeColor);
      });
    }

    if (selectedNodeId && graph.hasNode(selectedNodeId)) {
      const visibleRadius = getNodesWithinRadius(graph, selectedNodeId, 2);
      graph.forEachNode((node, attrs) => {
        if (!visibleRadius.has(node)) {
          graph.setNodeAttribute(node, 'color', graphTheme.fadedNodeColor);
          graph.setNodeAttribute(node, 'size', Math.max(1.2, attrs.baseSize * 0.72));
        }
      });

      const attrs = graph.getNodeAttributes(selectedNodeId);
      graph.setNodeAttribute(selectedNodeId, 'color', graphTheme.selectedNodeColor);
      graph.setNodeAttribute(selectedNodeId, 'size', attrs.baseSize * 1.25);
    }

    graph.forEachEdge((edge, attrs) => {
      if (highlightedEdges.has(attrs.pathKey)) {
        graph.setEdgeAttribute(edge, 'color', graphTheme.routeHighlightColor);
        graph.setEdgeAttribute(edge, 'size', 3);
      }
    });

    if (selectedNodeId && graph.hasNode(selectedNodeId)) {
      const camera = sigmaRef.current.getCamera();
      const attrs = graph.getNodeAttributes(selectedNodeId);
      camera.animate({ x: attrs.x, y: attrs.y, ratio: 0.35 }, { duration: 350 });
    }

    const refreshTimer = setTimeout(() => sigmaRef.current?.refresh(), 16);
    return () => clearTimeout(refreshTimer);
  }, [activeLineId, graph, graphTheme, highlightedEdges, hoveredNodeId, selectedNodeId]);

  return <div ref={containerRef} className='metro-map-grid h-[68vh] min-h-[460px] w-full rounded-lg border border-theme-border bg-theme-subcard shadow-theme-soft' />;
}
