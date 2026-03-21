import Graph from 'graphology';
import type { GraphStats, NodeRecord } from '../types/graph.js';

export function getNeighbors(graph: Graph, nodeId: string): NodeRecord[] {
  if (!graph.hasNode(nodeId)) return [];

  return graph.neighbors(nodeId).map((neighborId) => {
    const attrs = graph.getNodeAttributes(neighborId);
    return {
      id: neighborId,
      label: attrs.label,
      cluster: attrs.cluster,
      x: attrs.x,
      y: attrs.y,
      degree: graph.degree(neighborId),
    };
  });
}

export function shortestPath(graph: Graph, start: string, end: string): string[] {
  if (!graph.hasNode(start) || !graph.hasNode(end)) return [];
  if (start === end) return [start];

  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift() as string;

    for (const neighbor of graph.neighbors(current)) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, current);

      if (neighbor === end) {
        const path: string[] = [end];
        let cursor = end;
        while (parent.has(cursor)) {
          cursor = parent.get(cursor) as string;
          path.push(cursor);
        }
        return path.reverse();
      }

      queue.push(neighbor);
    }
  }

  return [];
}

export function calculateStats(graph: Graph, topN = 10): GraphStats {
  const nodeCount = graph.order;
  const edgeCount = graph.size;
  const clusters = new Set<string>();

  const hubs: Array<{ id: string; title: string; degree: number; cluster: string }> = [];

  graph.forEachNode((nodeId, attrs) => {
    clusters.add(attrs.cluster);
    hubs.push({
      id: nodeId,
      title: attrs.label,
      degree: graph.degree(nodeId),
      cluster: attrs.cluster,
    });
  });

  hubs.sort((a, b) => b.degree - a.degree);

  return {
    node_count: nodeCount,
    edge_count: edgeCount,
    cluster_count: clusters.size,
    average_degree: nodeCount === 0 ? 0 : Number(((2 * edgeCount) / nodeCount).toFixed(2)),
    top_hubs: hubs.slice(0, topN),
  };
}
