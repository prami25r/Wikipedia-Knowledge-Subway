import Graph from 'graphology';
import { buildGraph, loadGraphDataset } from '../graph/graphLoader.js';
import { calculateStats, getNeighbors } from '../graph/graphUtils.js';
import type { GraphStats, NodeRecord } from '../types/graph.js';

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

    const edges = this.graph.mapEdges((_edgeId, attrs, source, target) => ({ source, target }));
    return { nodes, edges };
  }

  getNode(nodeId: string): NodeRecord | null {
    if (!this.graph.hasNode(nodeId)) return null;
    const attrs = this.graph.getNodeAttributes(nodeId);

    return {
      id: nodeId,
      label: attrs.label,
      cluster: attrs.cluster,
      x: attrs.x,
      y: attrs.y,
      degree: this.graph.degree(nodeId),
    };
  }

  getNeighbors(nodeId: string): NodeRecord[] {
    return getNeighbors(this.graph, nodeId);
  }

  getStats(): GraphStats {
    return this.stats;
  }

  getGraphologyInstance(): Graph {
    return this.graph;
  }
}
