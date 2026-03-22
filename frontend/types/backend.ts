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

export interface BackendStationResponse {
  id: string;
  title: string;
  cluster: string;
  summary: string;
  categories: string[];
  degree: number;
  neighbors: BackendStationNeighbor[];
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
}

export interface BackendStatsResponse {
  node_count: number;
  edge_count: number;
  cluster_count: number;
  average_degree: number;
  top_hubs: Array<{ id: string; title: string; degree: number; cluster: string }>;
}
