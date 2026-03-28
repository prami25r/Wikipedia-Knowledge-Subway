export interface BackendNode {
  id: string;
  label: string;
  cluster: string;
  x: number;
  y: number;
  degree: number;
}

export interface BackendEdge {
  source: string;
  target: string;
}

export interface BackendGraphResponse {
  nodes: BackendNode[];
  edges: BackendEdge[];
}

export interface BackendStationNeighbor {
  id: string;
  title: string;
  cluster: string;
  degree: number;
}

export interface BackendNeighborCluster {
  cluster: string;
  count: number;
}

export interface BackendStationResponse {
  id: string;
  title: string;
  cluster: string;
  summary: string;
  categories: string[];
  degree: number;
  neighbors: BackendStationNeighbor[];
  neighbor_clusters: BackendNeighborCluster[];
  is_transfer_station: boolean;
  wikipedia_url: string;
}

export interface BackendSearchItem {
  id: string;
  title: string;
  cluster: string;
  degree: number;
}

export interface BackendSearchResponse {
  results: BackendSearchItem[];
}

export interface BackendRouteResponse {
  path: string[];
  distance: number;
  steps: BackendRouteStep[];
  clusters: string[];
  line_change_count: number;
}

export interface BackendRouteStep {
  id: string;
  title: string;
  cluster: string;
  degree: number;
  is_transfer: boolean;
}

export interface BackendHub {
  id: string;
  title: string;
  degree: number;
  cluster: string;
}

export interface BackendLineConnection {
  cluster: string;
  name: string;
  count: number;
}

export interface BackendLineSummary {
  id: string;
  name: string;
  station_count: number;
  internal_edge_count: number;
  connection_count: number;
  transfer_station_count: number;
  average_degree: number;
  top_hubs: BackendHub[];
  sample_stations: Array<{ id: string; title: string; degree: number }>;
  connected_lines: BackendLineConnection[];
}

export interface BackendLineStation {
  id: string;
  title: string;
  degree: number;
  cluster: string;
  neighbor_count: number;
  is_transfer_station: boolean;
}

export interface BackendTransferStation {
  id: string;
  title: string;
  degree: number;
  connected_clusters: string[];
}

export interface BackendLineDetailResponse extends BackendLineSummary {
  stations: BackendLineStation[];
  transfer_stations: BackendTransferStation[];
}

export interface BackendLinesResponse {
  lines: BackendLineSummary[];
}

export interface BackendStatsResponse {
  node_count: number;
  edge_count: number;
  cluster_count: number;
  average_degree: number;
  top_hubs: BackendHub[];
}
