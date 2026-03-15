import Graph from "graphology";
import { KnowledgeGraphDTO, GraphNode, GraphEdge } from "@/types/graph";

const FALLBACK_NODE_COLOR = "#38bdf8";
const FALLBACK_EDGE_COLOR = "#334155";

export function createGraphFromDTO(data: KnowledgeGraphDTO): Graph {
  const graph = new Graph();

  for (const node of data.nodes) {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        ...node.attributes,
        color: node.attributes.color || FALLBACK_NODE_COLOR,
      });
    }
  }

  for (const edge of data.edges) {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.id)) {
      graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
        ...edge.attributes,
        color: edge.attributes.color || FALLBACK_EDGE_COLOR,
      });
    }
  }

  return graph;
}

export function createDemoGraphDTO(): KnowledgeGraphDTO {
  const nodes: GraphNode[] = [
    { id: "wikipedia", attributes: { label: "Wikipedia", x: 0, y: 0, size: 22, color: "#22d3ee" } },
    { id: "knowledge", attributes: { label: "Knowledge Graph", x: 1, y: 0.3, size: 16, color: "#38bdf8" } },
    { id: "nlp", attributes: { label: "NLP", x: 0.4, y: 1, size: 14, color: "#818cf8" } },
    { id: "embedding", attributes: { label: "Embeddings", x: 1.6, y: 1, size: 14, color: "#a78bfa" } },
  ];

  const edges: GraphEdge[] = [
    { id: "e1", source: "wikipedia", target: "knowledge", attributes: { size: 2, color: "#334155", label: "indexes" } },
    { id: "e2", source: "knowledge", target: "nlp", attributes: { size: 2, color: "#475569", label: "supports" } },
    { id: "e3", source: "knowledge", target: "embedding", attributes: { size: 2, color: "#64748b", label: "uses" } },
  ];

  return { nodes, edges };
}
