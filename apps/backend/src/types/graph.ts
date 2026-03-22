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

export interface GraphStats {
  node_count: number;
  edge_count: number;
  cluster_count: number;
  average_degree: number;
  top_hubs: Array<{ id: string; title: string; degree: number; cluster: string }>;
}
