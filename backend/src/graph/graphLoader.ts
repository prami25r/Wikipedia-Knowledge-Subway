import fs from 'node:fs';
import path from 'node:path';
<<<<<<< HEAD
import { fileURLToPath } from 'node:url';
=======
>>>>>>> main
import Graph from 'graphology';
import type { GraphDataset } from '../types/graph.js';
import { normalizeNodeId } from '../utils/id.js';

<<<<<<< HEAD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadGraphDataset(filePath = path.resolve(__dirname, '../../data/layout_graph.json')): GraphDataset {
=======
export function loadGraphDataset(filePath = path.join(process.cwd(), 'public/data/layout_graph.json')): GraphDataset {
>>>>>>> main
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
    const normalizedId = normalizeNodeId(node.id);
    if (!normalizedId || graph.hasNode(normalizedId)) continue;

    graph.addNode(normalizedId, {
      id: normalizedId,
      sourceId: node.id,
      label: node.label,
      cluster: node.cluster,
      x: node.x,
      y: node.y,
    });
  }

  for (const edge of dataset.edges) {
    const source = normalizeNodeId(edge.source);
    const target = normalizeNodeId(edge.target);
    if (!source || !target) continue;
    if (!graph.hasNode(source) || !graph.hasNode(target)) continue;
    if (!graph.hasEdge(source, target)) {
      graph.addUndirectedEdge(source, target);
    }
  }

  graph.forEachNode((nodeKey) => {
    graph.mergeNodeAttributes(nodeKey, { degree: graph.degree(nodeKey) });
  });

  // eslint-disable-next-line no-console
  console.log(`[graphLoader] loaded nodes=${graph.order} edges=${graph.size}`);

  if (graph.order === 0 || graph.size === 0) {
    throw new Error('Graph dataset is empty after loading.');
  }

  return graph;
}
