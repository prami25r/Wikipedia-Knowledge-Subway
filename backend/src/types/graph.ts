export interface NodeRecord {
  id: string;
  label: string;
  cluster: string;
  x: number;
  y: number;
  degree: number;
}

export interface EdgeRecord {
  source: string;
  target: string;
}

export interface GraphDataset {
  nodes: Omit<NodeRecord, 'degree'>[];
  edges: EdgeRecord[];
}

export interface StationMetadata {
  id: string;
  title: string;
  summary: string;
  categories: string[];
  wikipedia_url: string;
}

export interface HubRecord {
  id: string;
  title: string;
  degree: number;
  cluster: string;
}

export interface LineConnection {
  cluster: string;
  name: string;
  count: number;
}

export interface LineStationRecord {
  id: string;
  title: string;
  degree: number;
  cluster: string;
  neighbor_count: number;
  is_transfer_station: boolean;
}

export interface TransferStationRecord {
  id: string;
  title: string;
  degree: number;
  connected_clusters: string[];
}

export interface LineSummary {
  id: string;
  name: string;
  station_count: number;
  internal_edge_count: number;
  connection_count: number;
  transfer_station_count: number;
  average_degree: number;
  top_hubs: HubRecord[];
  sample_stations: Array<{ id: string; title: string; degree: number }>;
  connected_lines: LineConnection[];
}

export interface LineDetail extends LineSummary {
  stations: LineStationRecord[];
  transfer_stations: TransferStationRecord[];
}

export interface RouteStep {
  id: string;
  title: string;
  cluster: string;
  degree: number;
  is_transfer: boolean;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  cluster_count: number;
  average_degree: number;
  top_hubs: HubRecord[];
}
