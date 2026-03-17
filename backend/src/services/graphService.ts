import Graph from 'graphology';
import { buildGraph, loadGraphDataset } from '../graph/graphLoader.js';
import { calculateStats, getNeighbors } from '../graph/graphUtils.js';
import type { GraphStats, NodeRecord } from '../types/graph.js';
import { normalizeNodeId } from '../utils/id.js';

export class GraphService {
  private graph: Graph;
  private stats: GraphStats;

  constructor() {
    const dataset = loadGraphDataset();
    this.graph = buildGraph(dataset);
    this.stats = calculateStats(this.graph);
  }

  getGraph(): { nodes: NodeRecord[]; edges: Array<{ source: string; target: string }> } {
    const nodes = this.graph.mapNodes((nodeId, attrs) => ({
      id: nodeId,
      label: attrs.label,
      cluster: attrs.cluster,
      x: attrs.x,
      y: attrs.y,
      degree: this.graph.degree(nodeId),
    }));

    const edges = this.graph.mapEdges((_edgeId, _attrs, source, target) => ({ source, target }));
    return { nodes, edges };
  }

  hasNode(nodeId: string): boolean {
    return this.graph.hasNode(normalizeNodeId(nodeId));
  }

  getNode(nodeId: string): NodeRecord | null {
    const normalizedId = normalizeNodeId(nodeId);
    if (!this.graph.hasNode(normalizedId)) return null;
    const attrs = this.graph.getNodeAttributes(normalizedId);

    return {
      id: normalizedId,
      label: attrs.label,
      cluster: attrs.cluster,
      x: attrs.x,
      y: attrs.y,
      degree: this.graph.degree(normalizedId),
    };
  }

  getNeighbors(nodeId: string): NodeRecord[] {
    return getNeighbors(this.graph, normalizeNodeId(nodeId));
  }

  getStats(): GraphStats {
    return this.stats;
  }

  getGraphologyInstance(): Graph {
    return this.graph;
  }
}
