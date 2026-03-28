import Graph from 'graphology';
import { buildGraph, loadGraphDataset } from '../graph/graphLoader.js';
import { calculateStats, getNeighbors } from '../graph/graphUtils.js';
import type {
  GraphStats,
  LineConnection,
  LineDetail,
  LineStationRecord,
  LineSummary,
  NodeRecord,
  TransferStationRecord,
} from '../types/graph.js';
import { normalizeNodeId } from '../utils/id.js';

function humanizeCluster(cluster: string): string {
  return cluster
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export class GraphService {
  private graph: Graph;
  private stats: GraphStats;
  private lineDetails: LineDetail[];
  private lineDetailsById: Map<string, LineDetail>;

  constructor() {
    const dataset = loadGraphDataset();
    this.graph = buildGraph(dataset);
    this.stats = calculateStats(this.graph);
    this.lineDetails = this.buildLineDetails();
    this.lineDetailsById = new Map(this.lineDetails.map((line) => [line.id, line]));
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

  getLines(): LineSummary[] {
    return this.lineDetails.map((line) => ({
      id: line.id,
      name: line.name,
      station_count: line.station_count,
      internal_edge_count: line.internal_edge_count,
      connection_count: line.connection_count,
      transfer_station_count: line.transfer_station_count,
      average_degree: line.average_degree,
      top_hubs: line.top_hubs,
      sample_stations: line.sample_stations,
      connected_lines: line.connected_lines,
    }));
  }

  getLine(clusterId: string): LineDetail | null {
    const normalizedClusterId = clusterId.trim().toLowerCase();
    return this.lineDetailsById.get(normalizedClusterId) ?? null;
  }

  getGraphologyInstance(): Graph {
    return this.graph;
  }

  private buildLineDetails(): LineDetail[] {
    const clusterNodes = new Map<string, string[]>();
    const internalEdgeCounts = new Map<string, number>();
    const externalConnectionCounts = new Map<string, Map<string, number>>();

    this.graph.forEachNode((nodeId, attrs) => {
      const cluster = String(attrs.cluster);
      const nodes = clusterNodes.get(cluster) ?? [];
      nodes.push(nodeId);
      clusterNodes.set(cluster, nodes);
    });

    this.graph.forEachEdge((_edgeId, _attrs, source, target) => {
      const sourceCluster = String(this.graph.getNodeAttribute(source, 'cluster'));
      const targetCluster = String(this.graph.getNodeAttribute(target, 'cluster'));

      if (sourceCluster === targetCluster) {
        internalEdgeCounts.set(sourceCluster, (internalEdgeCounts.get(sourceCluster) ?? 0) + 1);
        return;
      }

      this.incrementLineConnection(externalConnectionCounts, sourceCluster, targetCluster);
      this.incrementLineConnection(externalConnectionCounts, targetCluster, sourceCluster);
    });

    return Array.from(clusterNodes.entries())
      .map(([cluster, nodeIds]) => {
        const stations = nodeIds
          .map((nodeId) => {
            const attrs = this.graph.getNodeAttributes(nodeId);
            const connectedClusters = new Set(
              this.graph
                .neighbors(nodeId)
                .map((neighborId) => String(this.graph.getNodeAttribute(neighborId, 'cluster')))
                .filter((neighborCluster) => neighborCluster !== cluster),
            );

            const station: LineStationRecord = {
              id: nodeId,
              title: String(attrs.label),
              degree: this.graph.degree(nodeId),
              cluster,
              neighbor_count: this.graph.degree(nodeId),
              is_transfer_station: connectedClusters.size > 0,
            };

            return {
              station,
              connectedClusters: Array.from(connectedClusters).sort(),
            };
          })
          .sort((left, right) => right.station.degree - left.station.degree || left.station.title.localeCompare(right.station.title));

        const transferStations: TransferStationRecord[] = stations
          .filter((entry) => entry.station.is_transfer_station)
          .map((entry) => ({
            id: entry.station.id,
            title: entry.station.title,
            degree: entry.station.degree,
            connected_clusters: entry.connectedClusters,
          }));

        const stationCount = stations.length;
        const totalDegree = stations.reduce((sum, entry) => sum + entry.station.degree, 0);
        const lineConnections = externalConnectionCounts.get(cluster) ?? new Map<string, number>();
        const connectedLines: LineConnection[] = Array.from(lineConnections.entries())
          .map(([connectedCluster, count]) => ({
            cluster: connectedCluster,
            name: humanizeCluster(connectedCluster),
            count,
          }))
          .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));

        return {
          id: cluster,
          name: `${humanizeCluster(cluster)} Line`,
          station_count: stationCount,
          internal_edge_count: internalEdgeCounts.get(cluster) ?? 0,
          connection_count: Array.from(lineConnections.values()).reduce((sum, count) => sum + count, 0),
          transfer_station_count: transferStations.length,
          average_degree: stationCount === 0 ? 0 : Number((totalDegree / stationCount).toFixed(2)),
          top_hubs: stations.slice(0, 5).map((entry) => ({
            id: entry.station.id,
            title: entry.station.title,
            degree: entry.station.degree,
            cluster,
          })),
          sample_stations: stations.slice(0, 6).map((entry) => ({
            id: entry.station.id,
            title: entry.station.title,
            degree: entry.station.degree,
          })),
          connected_lines: connectedLines,
          stations: stations.map((entry) => entry.station),
          transfer_stations: transferStations,
        } satisfies LineDetail;
      })
      .sort((left, right) => right.station_count - left.station_count || left.name.localeCompare(right.name));
  }

  private incrementLineConnection(store: Map<string, Map<string, number>>, sourceCluster: string, targetCluster: string): void {
    const connectionMap = store.get(sourceCluster) ?? new Map<string, number>();
    connectionMap.set(targetCluster, (connectionMap.get(targetCluster) ?? 0) + 1);
    store.set(sourceCluster, connectionMap);
  }
}
