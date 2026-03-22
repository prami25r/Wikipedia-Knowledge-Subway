export interface KnowledgeNode {
  id: string;
  title: string;
  category: string;
  rank: number;
  weight: number;
  summary?: string;
  tags?: string[];
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relation: 'link' | 'category' | 'semantic' | 'transfer';
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  version: string;
}

export interface SubwayLine {
  id: string;
  name: string;
  color: string;
  stationIds: string[];
}

export interface SubwayStation {
  id: string;
  title: string;
  lineIds: string[];
  transfer: boolean;
  rank: number;
  weight: number;
}

export interface SubwayMap {
  lines: SubwayLine[];
  stations: SubwayStation[];
  transfers: Array<{ from: string; to: string }>;
  version: string;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  label: string;
  lineIds: string[];
}

export interface LayoutEdge {
  source: string;
  target: string;
  lineHint?: string;
}

export interface LayoutMap {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  algorithm: 'grid' | 'hierarchical' | 'force-constrained';
  checksum: string;
}

export interface ExploreResponse {
  focus: string;
  neighbors: string[];
  recommendedStations: string[];
  suggestedPaths: string[][];
}
