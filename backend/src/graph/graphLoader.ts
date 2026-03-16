import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Graph from 'graphology';
import type { GraphDataset } from '../types/graph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadGraphDataset(filePath = path.resolve(__dirname, '../../data/layout_graph.json')): GraphDataset {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as GraphDataset;

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid dataset format. Expected nodes[] and edges[].');
  }

  return parsed;
}

export function buildGraph(dataset: GraphDataset): Graph {
  const graph = new Graph({ multi: false, type: 'undirected' });

  for (const node of dataset.nodes) {
    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        id: node.id,
        label: node.label,
        cluster: node.cluster,
        x: node.x,
        y: node.y,
      });
    }
  }

  for (const edge of dataset.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    if (!graph.hasEdge(edge.source, edge.target)) {
      graph.addUndirectedEdge(edge.source, edge.target);
    }
  }

  graph.forEachNode((nodeKey) => {
    graph.mergeNodeAttributes(nodeKey, { degree: graph.degree(nodeKey) });
  });

  return graph;
}
