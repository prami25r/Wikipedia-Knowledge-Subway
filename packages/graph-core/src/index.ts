import type { KnowledgeEdge, KnowledgeGraph, KnowledgeNode } from '../../shared-types/src/index.js';

export interface RawArticle {
  id: string;
  title: string;
  category: string;
  summary?: string;
  tags?: string[];
}

export interface RawLink {
  source: string;
  target: string;
  relation?: KnowledgeEdge['relation'];
  weight?: number;
}

export function normalizeId(input: string): string {
  return input.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function buildKnowledgeGraph(rawNodes: RawArticle[], rawEdges: RawLink[], version = 'v1'): KnowledgeGraph {
  const nodeMap = new Map<string, KnowledgeNode>();
  for (const rawNode of rawNodes) {
    const id = normalizeId(rawNode.id || rawNode.title);
    if (!id || nodeMap.has(id)) continue;
    nodeMap.set(id, {
      id,
      title: rawNode.title,
      category: rawNode.category || 'uncategorized',
      rank: 0,
      weight: 1,
      summary: rawNode.summary,
      tags: rawNode.tags ?? [],
    });
  }

  const edges: KnowledgeEdge[] = [];
  const degree = new Map<string, number>();

  for (const rawEdge of rawEdges) {
    const source = normalizeId(rawEdge.source);
    const target = normalizeId(rawEdge.target);
    if (!nodeMap.has(source) || !nodeMap.has(target) || source === target) continue;

    edges.push({
      source,
      target,
      relation: rawEdge.relation ?? 'link',
      weight: rawEdge.weight ?? 1,
    });

    degree.set(source, (degree.get(source) ?? 0) + 1);
    degree.set(target, (degree.get(target) ?? 0) + 1);
  }

  const nodes = Array.from(nodeMap.values()).map((node) => {
    const nodeDegree = degree.get(node.id) ?? 0;
    return {
      ...node,
      rank: nodeDegree,
      weight: 1 + Math.log1p(nodeDegree),
    };
  });

  return {
    nodes,
    edges,
    version,
  };
}
