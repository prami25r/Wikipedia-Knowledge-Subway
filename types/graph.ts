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
