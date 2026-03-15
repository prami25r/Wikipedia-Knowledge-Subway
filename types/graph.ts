export type NodeAttributes = {
  label: string;
  color: string;
  x: number;
  y: number;
  size: number;
  articleUrl?: string;
};

export type EdgeAttributes = {
  color: string;
  size: number;
  label?: string;
};

export type GraphNode = {
  id: string;
  attributes: NodeAttributes;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  attributes: EdgeAttributes;
};

export type KnowledgeGraphDTO = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type RawWikiGraphNode = {
  id: string;
  summary: string;
  categories: string[];
};

export type RawWikiGraphEdge = {
  source: string;
  target: string;
};

export type RawWikiGraph = {
  nodes: RawWikiGraphNode[];
  edges: RawWikiGraphEdge[];
};

export type ProcessedWikiGraphNode = {
  id: string;
  degree: number;
  centrality: number;
  cluster: number;
};

export type ProcessedWikiGraphEdge = {
  source: string;
  target: string;
};

export type ProcessedWikiGraph = {
  nodes: ProcessedWikiGraphNode[];
  edges: ProcessedWikiGraphEdge[];
};
